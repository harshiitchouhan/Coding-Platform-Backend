function cleanType(type) {
  return type.replace(/&/g, "").replace(/\s+/g, "").trim();
}

function parseFunctionSignature(code, language) {
  if (language === "javascript") {
    const regex = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;
    const match = code.match(regex);

    if (!match) throw new Error("Invalid JavaScript function");

    const functionName = match[1].trim();

    const params = match[2]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        type: "any",
      }));

    return {
      returnType: "any",
      functionName,
      params,
    };
  }

  // remove access modifiers like public:
  const cleanedCode = code
      // remove C++ access labels like public:
      .replace(/\b(public|private|protected)\s*:/g, "")
      // remove Java modifiers like public, private, static
      .replace(/\b(public|private|protected|static)\b/g, "")
      // normalize spaces
      .replace(/\s+/g, " ")
      .trim();


  const regex =
    /([a-zA-Z0-9_<>\[\]\s:&*]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;

  const match = cleanedCode.match(regex);

  if (!match) throw new Error("Invalid function signature");

  const returnType = match[1].trim();
  const functionName = match[2].trim();
  const paramsString = match[3].trim();

  const params = paramsString ? paramsString.split(",") : [];

  const parsedParams = params.map((p) => {
    const cleaned = p.trim().replace(/\s+/g, " ");
    const lastSpace = cleaned.lastIndexOf(" ");

    let type = cleaned.slice(0, lastSpace).trim();
    let name = cleaned.slice(lastSpace + 1).trim();

    name = name.replace(/[&*]/g, "").trim();
    type = type.replace(/&/g, "").trim();

    return { name, type };
  });

  return {
    returnType,
    functionName,
    params: parsedParams,
  };
}

/*  C++  */

function generateCppParser(param) {
  const type = cleanType(param.type);

  if (type === "vector<int>") {
    return `
    vector<int> ${param.name};
    {
        string line;
        cin >> line;

        line = line.substr(1, line.size() - 2);
        stringstream ss(line);
        string num;

        while (getline(ss, num, ',')) {
            if (!num.empty()) {
                ${param.name}.push_back(stoi(num));
            }
        }
    }
`;
  }

  if (type === "int") {
    return `
    int ${param.name};
    cin >> ${param.name};
`;
  }

  if (type === "string") {
    return `
    string ${param.name};
    cin >> ${param.name};
`;
  }

  if (type === "bool") {
    return `
    bool ${param.name};
    cin >> boolalpha >> ${param.name};
`;
  }

  throw new Error("Unsupported C++ parameter type: " + param.type);
}

function generateCppPrinter(returnType) {
  const type = cleanType(returnType);

  if (type === "vector<int>") {
    return `
    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i != result.size() - 1) cout << ",";
    }
    cout << "]";
`;
  }

  if (type === "int") {
    return `
    cout << result;
`;
  }

  if (type === "string") {
    return `
    cout << result;
`;
  }

  if (type === "bool") {
    return `
    cout << (result ? "true" : "false");
`;
  }

  throw new Error("Unsupported C++ return type: " + returnType);
}

function wrapCPP(code, functionName, params, returnType) {
  let parsing = "";
  const names = [];

  for (const param of params) {
    parsing += generateCppParser(param);
    names.push(param.name);
  }

  return `
#include <bits/stdc++.h>
using namespace std;

${code}

int main() {
    Solution sol;

    ${parsing}

    auto result = sol.${functionName}(${names.join(", ")});

    ${generateCppPrinter(returnType)}

    return 0;
}
`;
}

/* JavaScript */

function wrapJS(code, functionName, params) {
  let parsing = "";
  const names = [];

  params.forEach((p, i) => {
    names.push(p.name);

    parsing += `
let ${p.name} = input[${i}].startsWith("[")
  ? JSON.parse(input[${i}])
  : input[${i}] === "true"
  ? true
  : input[${i}] === "false"
  ? false
  : isNaN(Number(input[${i}]))
  ? input[${i}]
  : Number(input[${i}]);
`;
  });

  return `
${code}

const fs = require("fs");
const raw = fs.readFileSync(0, "utf-8").trim();
const input = raw.length ? raw.split("\\n").map(x => x.trim()).filter(Boolean) : [];

${parsing}

const result = ${functionName}(${names.join(", ")});

if (typeof result === "string") {
  console.log(result);
} else {
  console.log(JSON.stringify(result));
}
`;
}

/* Java */

function generateJavaParser(param, index) {
  const type = cleanType(param.type);

  if (type === "int[]") {
    return `
        String line${index} = lines.get(${index}).replaceAll("[\\\\[\\\\]]", "");
        String[] parts${index} = line${index}.isEmpty() ? new String[0] : line${index}.split(",");
        int[] ${param.name} = new int[parts${index}.length];

        for (int j = 0; j < parts${index}.length; j++) {
            ${param.name}[j] = Integer.parseInt(parts${index}[j].trim());
        }
`;
  }

  if (type === "int") {
    return `
        int ${param.name} = Integer.parseInt(lines.get(${index}).trim());
`;
  }

  if (type === "String") {
    return `
        String ${param.name} = lines.get(${index}).trim();
`;
  }

  if (type === "boolean") {
    return `
        boolean ${param.name} = Boolean.parseBoolean(lines.get(${index}).trim());
`;
  }

  throw new Error("Unsupported Java parameter type: " + param.type);
}

function generateJavaPrinter(returnType) {
  const type = cleanType(returnType);

  if (type === "int[]") {
    return `
        System.out.println(Arrays.toString(result).replace(" ", ""));
`;
  }

  if (type === "int") {
    return `
        System.out.println(result);
`;
  }

  if (type === "String") {
    return `
        System.out.println(result);
`;
  }

  if (type === "boolean") {
    return `
        System.out.println(result ? "true" : "false");
`;
  }

  throw new Error("Unsupported Java return type: " + returnType);
}

function wrapJava(code, functionName, params, returnType) {
  let parsing = "";
  const names = [];

  params.forEach((param, index) => {
    parsing += generateJavaParser(param, index);
    names.push(param.name);
  });

  return `
import java.util.*;

${code}

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<String> lines = new ArrayList<>();

        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (!line.isEmpty()) lines.add(line);
        }

        Solution sol = new Solution();

        ${parsing}

        var result = sol.${functionName}(${names.join(", ")});

        ${generateJavaPrinter(returnType)}
    }
}
`;
}

/* Main */

function wrapCode(code, language) {
  const { functionName, params, returnType } = parseFunctionSignature(
    code,
    language
  );

  if (language === "cpp") {
    return wrapCPP(code, functionName, params, returnType);
  }

  if (language === "javascript") {
    return wrapJS(code, functionName, params);
  }

  if (language === "java") {
    return wrapJava(code, functionName, params, returnType);
  }

  throw new Error("Unsupported language");
}

module.exports = wrapCode;