function cleanType(type) {
  return type
    .replace(/\bconst\b/g, "")
    .replace(/&/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function splitParams(paramsString) {
  let result = [];
  let current = "";
  let depth = 0;

  for (let char of paramsString) {
    if (char === "<") depth++;
    if (char === ">") depth--;

    if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) result.push(current.trim());
  return result;
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

  const cleanedCode = code
    .replace(/\b(public|private|protected)\s*:/g, "")
    .replace(/\b(public|private|protected|static)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const regex =
    /([a-zA-Z0-9_<>\[\]\s:&*]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;

  const match = cleanedCode.match(regex);

  if (!match) throw new Error("Invalid function signature");

  const returnType = match[1].trim();
  const functionName = match[2].trim();
  const paramsString = match[3].trim();

  const params = paramsString ? splitParams(paramsString) : [];

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

/* ================= C++ ================= */

const cppCommonHelpers = `
vector<int> parseVectorInt(string line) {
    vector<int> result;
    string num = "";

    for (char c : line) {
        if (isdigit(c) || c == '-') {
            num += c;
        } else {
            if (!num.empty()) {
                result.push_back(stoi(num));
                num = "";
            }
        }
    }

    if (!num.empty()) result.push_back(stoi(num));
    return result;
}

vector<string> parseVectorString(string line) {
    vector<string> result;
    string current = "";
    bool inside = false;

    for (char c : line) {
        if (c == '"') {
            if (inside) {
                result.push_back(current);
                current = "";
            }
            inside = !inside;
        } else if (inside) {
            current += c;
        }
    }

    return result;
}

vector<vector<int>> parseMatrix(string line) {
    vector<vector<int>> matrix;
    vector<int> row;
    string num = "";
    int depth = 0;

    for (char c : line) {
        if (c == '[') {
            depth++;
            if (depth == 2) row.clear();
        } else if (isdigit(c) || c == '-') {
            num += c;
        } else {
            if (!num.empty()) {
                row.push_back(stoi(num));
                num = "";
            }

            if (c == ']') {
                if (depth == 2) {
                    matrix.push_back(row);
                    row.clear();
                }
                depth--;
            }
        }
    }

    return matrix;
}

struct ListNode {
    int val;
    ListNode* next;

    ListNode(int x) {
        val = x;
        next = NULL;
    }
};

ListNode* buildLinkedList(string line) {
    vector<int> arr = parseVectorInt(line);

    if (arr.empty()) return NULL;

    ListNode* head = new ListNode(arr[0]);
    ListNode* temp = head;

    for (int i = 1; i < arr.size(); i++) {
        temp->next = new ListNode(arr[i]);
        temp = temp->next;
    }

    return head;
}

vector<int> linkedListToVector(ListNode* head) {
    vector<int> result;

    while (head != NULL) {
        result.push_back(head->val);
        head = head->next;
    }

    return result;
}

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;

    TreeNode(int x) {
        val = x;
        left = NULL;
        right = NULL;
    }
};

vector<string> parseTreeTokens(string line) {
    vector<string> tokens;
    string current = "";

    for (char c : line) {
        if (isalnum(c) || c == '-') {
            current += c;
        } else {
            if (!current.empty()) {
                tokens.push_back(current);
                current = "";
            }
        }
    }

    if (!current.empty()) tokens.push_back(current);
    return tokens;
}

TreeNode* buildTree(string line) {
    vector<string> nodes = parseTreeTokens(line);

    if (nodes.empty() || nodes[0] == "null" || nodes[0] == "") return NULL;

    TreeNode* root = new TreeNode(stoi(nodes[0]));
    queue<TreeNode*> q;
    q.push(root);

    int i = 1;

    while (!q.empty() && i < nodes.size()) {
        TreeNode* curr = q.front();
        q.pop();

        if (i < nodes.size() && nodes[i] != "null" && !nodes[i].empty()) {
            curr->left = new TreeNode(stoi(nodes[i]));
            q.push(curr->left);
        }
        i++;

        if (i < nodes.size() && nodes[i] != "null" && !nodes[i].empty()) {
            curr->right = new TreeNode(stoi(nodes[i]));
            q.push(curr->right);
        }
        i++;
    }

    return root;
}
    
vector<string> treeToVector(TreeNode* root) {
    vector<string> result;

    if (!root) return result;

    queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        TreeNode* node = q.front();
        q.pop();

        if (node) {
            result.push_back(to_string(node->val));
            q.push(node->left);
            q.push(node->right);
        } else {
            result.push_back("null");
        }
    }

    while (!result.empty() && result.back() == "null") {
        result.pop_back();
    }

    return result;
}
`;

function generateCppParser(param) {
  const type = cleanType(param.type);

  if (type === "int") {
    return `
    int ${param.name};
    cin >> ${param.name};
`;
  }

  if (type === "longlong") {
    return `
    long long ${param.name};
    cin >> ${param.name};
`;
  }

  if (type === "double") {
    return `
    double ${param.name};
    cin >> ${param.name};
`;
  }

  if (type === "string") {
    return `
    string ${param.name};
    getline(cin >> ws, ${param.name});
`;
  }

  if (type === "bool") {
    return `
    bool ${param.name};
    cin >> boolalpha >> ${param.name};
`;
  }

  if (type === "vector<int>") {
    return `
    vector<int> ${param.name};
    {
        string line;
        getline(cin >> ws, line);
        ${param.name} = parseVectorInt(line);
    }
`;
  }

  if (type === "vector<string>") {
    return `
    vector<string> ${param.name};
    {
        string line;
        getline(cin >> ws, line);
        ${param.name} = parseVectorString(line);
    }
`;
  }

  if (type === "vector<vector<int>>") {
    return `
    vector<vector<int>> ${param.name};
    {
        string line;
        getline(cin >> ws, line);
        ${param.name} = parseMatrix(line);
    }
`;
  }

  if (type === "ListNode*") {
    return `
    ListNode* ${param.name};
    {
        string line;
        getline(cin >> ws, line);
        ${param.name} = buildLinkedList(line);
    }
`;
  }

  if (type === "TreeNode*") {
    return `
    TreeNode* ${param.name};
    {
        string line;
        getline(cin >> ws, line);
        ${param.name} = buildTree(line);
    }
`;
  }

  throw new Error("Unsupported C++ parameter type: " + param.type);
}

function generateCppPrinter(returnType) {
  const type = cleanType(returnType);

  if (type === "void") return "";

  if (type === "int" || type === "longlong" || type === "double") {
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

  if (type === "vector<string>") {
    return `
    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        cout << "\\\"" << result[i] << "\\\"";
        if (i != result.size() - 1) cout << ",";
    }
    cout << "]";
`;
  }

  if (type === "vector<vector<int>>") {
    return `
    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        cout << "[";
        for (int j = 0; j < result[i].size(); j++) {
            cout << result[i][j];
            if (j != result[i].size() - 1) cout << ",";
        }
        cout << "]";
        if (i != result.size() - 1) cout << ",";
    }
    cout << "]";
`;
  }

  if (type === "ListNode*") {
    return `
    vector<int> arr = linkedListToVector(result);
    cout << "[";
    for (int i = 0; i < arr.size(); i++) {
        cout << arr[i];
        if (i != arr.size() - 1) cout << ",";
    }
    cout << "]";
`;
  }

  if (type === "TreeNode*") {
    return `
    vector<string> arr = treeToVector(result);
    cout << "[";
    for (int i = 0; i < arr.size(); i++) {
        cout << arr[i];
        if (i != arr.size() - 1) cout << ",";
    }
    cout << "]";
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

  const type = cleanType(returnType);

  let callCode =
    type === "void"
      ? `
    sol.${functionName}(${names.join(", ")});
`
      : `
    auto result = sol.${functionName}(${names.join(", ")});
`;

  return `
#include <bits/stdc++.h>
using namespace std;

${cppCommonHelpers}

${code}

int main() {
    Solution sol;

    ${parsing}

    ${callCode}

    ${generateCppPrinter(returnType)}

    return 0;
}
`;
}

/* ================= JAVASCRIPT ================= */

function wrapJS(code, functionName, params) {
  let parsing = "";
  const names = [];

  params.forEach((p, i) => {
    names.push(p.name);

    parsing += `
let ${p.name} = parseInput(input[${i}]);

if (isLinkedListParam("${p.name}")) {
  ${p.name} = buildLinkedList(${p.name});
}
`;
  });

  return `
${code}

const fs = require("fs");

const raw = fs.readFileSync(0, "utf-8").trim();
const input = raw.length ? raw.split("\\n").map(x => x.trim()).filter(Boolean) : [];

function ListNode(val) {
  this.val = val;
  this.next = null;
}

function TreeNode(val) {
  this.val = val;
  this.left = null;
  this.right = null;
}

function parseInput(value) {
  if (value === undefined) return undefined;

  if (value === "true") return true;
  if (value === "false") return false;

  if (
    (value.startsWith("[") && value.endsWith("]")) ||
    (value.startsWith("{") && value.endsWith("}"))
  ) {
    return JSON.parse(value);
  }

  if (!isNaN(Number(value))) return Number(value);

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function isLinkedListParam(name) {
  return (
    name === "head" ||
    name === "list1" ||
    name === "list2" ||
    name.toLowerCase().includes("list")
  );
}

function buildLinkedList(arr) {
  if (!arr || arr.length === 0) return null;

  let head = new ListNode(arr[0]);
  let temp = head;

  for (let i = 1; i < arr.length; i++) {
    temp.next = new ListNode(arr[i]);
    temp = temp.next;
  }

  return head;
}

function linkedListToArray(head) {
  let result = [];

  while (head !== null) {
    result.push(head.val);
    head = head.next;
  }

  return result;
}

function isListNode(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.prototype.hasOwnProperty.call(value, "val") &&
    Object.prototype.hasOwnProperty.call(value, "next")
  );
}

function buildTree(arr) {
  if (!arr || arr.length === 0 || arr[0] === null) return null;

  let root = new TreeNode(arr[0]);
  let queue = [root];
  let i = 1;

  while (queue.length && i < arr.length) {
    let node = queue.shift();

    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;

    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }

  return root;
}

function treeToArray(root) {
  if (!root) return [];

  let result = [];
  let queue = [root];

  while (queue.length) {
    let node = queue.shift();

    if (node === null) {
      result.push(null);
    } else {
      result.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    }
  }

  while (result.length && result[result.length - 1] === null) {
    result.pop();
  }

  return result;
}

${parsing}

const result = ${functionName}(${names.join(", ")});

if (result === undefined) {
  console.log("");
} else if (isListNode(result)) {
  console.log(JSON.stringify(linkedListToArray(result)));
} else if (typeof result === "string") {
  console.log(result);
} else {
  console.log(JSON.stringify(result));
}
`;
}

/* ================= JAVA ================= */

const javaHelpers = `
class ListNode {
    int val;
    ListNode next;

    ListNode(int val) {
        this.val = val;
    }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

class Parser {
    static int[] parseIntArray(String line) {
        line = line.replaceAll("[\\\\[\\\\]]", "").trim();

        if (line.isEmpty()) return new int[0];

        String[] parts = line.split(",");
        int[] arr = new int[parts.length];

        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }

        return arr;
    }

    static String[] parseStringArray(String line) {
        ArrayList<String> list = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inside = false;

        for (char c : line.toCharArray()) {
            if (c == '"') {
                if (inside) {
                    list.add(current.toString());
                    current.setLength(0);
                }
                inside = !inside;
            } else if (inside) {
                current.append(c);
            }
        }

        return list.toArray(new String[0]);
    }

    static int[][] parseMatrix(String line) {
        ArrayList<int[]> rows = new ArrayList<>();
        ArrayList<Integer> row = new ArrayList<>();

        StringBuilder num = new StringBuilder();
        int depth = 0;

        for (char c : line.toCharArray()) {
            if (c == '[') {
                depth++;
                if (depth == 2) row.clear();
            } else if (Character.isDigit(c) || c == '-') {
                num.append(c);
            } else {
                if (num.length() > 0) {
                    row.add(Integer.parseInt(num.toString()));
                    num.setLength(0);
                }

                if (c == ']') {
                    if (depth == 2) {
                        int[] arr = new int[row.size()];
                        for (int i = 0; i < row.size(); i++) arr[i] = row.get(i);
                        rows.add(arr);
                        row.clear();
                    }
                    depth--;
                }
            }
        }

        int[][] matrix = new int[rows.size()][];

        for (int i = 0; i < rows.size(); i++) {
            matrix[i] = rows.get(i);
        }

        return matrix;
    }

    static ListNode buildLinkedList(String line) {
        int[] arr = parseIntArray(line);

        if (arr.length == 0) return null;

        ListNode head = new ListNode(arr[0]);
        ListNode temp = head;

        for (int i = 1; i < arr.length; i++) {
            temp.next = new ListNode(arr[i]);
            temp = temp.next;
        }

        return head;
    }

    static String linkedListToString(ListNode head) {
        ArrayList<Integer> arr = new ArrayList<>();

        while (head != null) {
            arr.add(head.val);
            head = head.next;
        }

        return arr.toString().replace(" ", "");
    }

    static ArrayList<String> parseTreeTokens(String line) {
        ArrayList<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (char c : line.toCharArray()) {
            if (Character.isLetterOrDigit(c) || c == '-') {
                current.append(c);
            } else {
                if (current.length() > 0) {
                    tokens.add(current.toString());
                    current.setLength(0);
                }
            }
        }

        if (current.length() > 0) tokens.add(current.toString());

        return tokens;
    }

    static TreeNode buildTree(String line) {
    ArrayList<String> nodes = parseTreeTokens(line);

    if (nodes.size() == 0 || nodes.get(0).equals("null") || nodes.get(0).isEmpty()) return null;

    TreeNode root = new TreeNode(Integer.parseInt(nodes.get(0)));

    Queue<TreeNode> q = new LinkedList<>();
    q.add(root);

    int i = 1;

    while (!q.isEmpty() && i < nodes.size()) {
        TreeNode curr = q.poll();

        if (i < nodes.size() && !nodes.get(i).equals("null") && !nodes.get(i).isEmpty()) {
            curr.left = new TreeNode(Integer.parseInt(nodes.get(i)));
            q.add(curr.left);
        }
        i++;

        if (i < nodes.size() && !nodes.get(i).equals("null") && !nodes.get(i).isEmpty()) {
            curr.right = new TreeNode(Integer.parseInt(nodes.get(i)));
            q.add(curr.right);
        }
        i++;
    }

    return root;
}
    static String treeToString(TreeNode root) {
        if (root == null) return "[]";

        ArrayList<String> result = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);

        while (!q.isEmpty()) {
            TreeNode node = q.poll();

            if (node == null) {
                result.add("null");
            } else {
                result.add(String.valueOf(node.val));
                q.add(node.left);
                q.add(node.right);
            }
        }

        while (result.size() > 0 && result.get(result.size() - 1).equals("null")) {
            result.remove(result.size() - 1);
        }

        return "[" + String.join(",", result) + "]";
    }
}
`;

function generateJavaParser(param, index) {
  const type = cleanType(param.type);

  if (type === "int") {
    return `
        int ${param.name} = Integer.parseInt(lines.get(${index}).trim());
`;
  }

  if (type === "long") {
    return `
        long ${param.name} = Long.parseLong(lines.get(${index}).trim());
`;
  }

  if (type === "double") {
    return `
        double ${param.name} = Double.parseDouble(lines.get(${index}).trim());
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

  if (type === "int[]") {
    return `
        int[] ${param.name} = Parser.parseIntArray(lines.get(${index}));
`;
  }

  if (type === "String[]") {
    return `
        String[] ${param.name} = Parser.parseStringArray(lines.get(${index}));
`;
  }

  if (type === "int[][]") {
    return `
        int[][] ${param.name} = Parser.parseMatrix(lines.get(${index}));
`;
  }

  if (type === "ListNode") {
    return `
        ListNode ${param.name} = Parser.buildLinkedList(lines.get(${index}));
`;
  }

  if (type === "TreeNode") {
    return `
        TreeNode ${param.name} = Parser.buildTree(lines.get(${index}));
`;
  }

  throw new Error("Unsupported Java parameter type: " + param.type);
}

function generateJavaPrinter(returnType) {
  const type = cleanType(returnType);

  if (type === "void") return "";

  if (type === "int" || type === "long" || type === "double") {
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

  if (type === "int[]") {
    return `
        System.out.println(Arrays.toString(result).replace(" ", ""));
`;
  }

  if (type === "String[]") {
    return `
        System.out.print("[");
        for (int i = 0; i < result.length; i++) {
            System.out.print("\\\\"" + result[i] + "\\\\"");
            if (i != result.length - 1) System.out.print(",");
        }
        System.out.println("]");
`;
  }

  if (type === "int[][]") {
    return `
        System.out.print("[");
        for (int i = 0; i < result.length; i++) {
            System.out.print(Arrays.toString(result[i]).replace(" ", ""));
            if (i != result.length - 1) System.out.print(",");
        }
        System.out.println("]");
`;
  }

  if (type === "ListNode") {
    return `
        System.out.println(Parser.linkedListToString(result));
`;
  }

  if (type === "TreeNode") {
    return `
        System.out.println(Parser.treeToString(result));
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

  const type = cleanType(returnType);

  let callCode =
    type === "void"
      ? `
        sol.${functionName}(${names.join(", ")});
`
      : `
        var result = sol.${functionName}(${names.join(", ")});
`;

  return `
import java.util.*;

${javaHelpers}

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

        ${callCode}

        ${generateJavaPrinter(returnType)}
    }
}
`;
}

/* ================= MAIN ================= */

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