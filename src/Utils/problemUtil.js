const axios = require("axios");
const getLanguageById = (lang)=>{

        const language = {
        cpp: 54,
        javascript: 63,
        java: 62
        };

    return language[lang.toLowerCase()];
}
const submitBatch = async (submission)=>{

    const options = {
    method: 'POST',
    url: process.env.JUDGE_URL,
    params: {
        base64_encoded: true // no need to decode 
    },
    headers: {
        'x-rapidapi-key': process.env.JUDGE_KEY,
        'x-rapidapi-host': process.env.JUDGE_HOST ,
        'Content-Type': 'application/json'
    },

    data: {
        submissions : submission
    }
    };

    //actual api fetching using axios(build on top of fetch only) use gpt
    async function fetchData() {
        try {
            const response = await axios.request(options);  // option mei method hai
            return response.data;  // it returns token
        } catch (error) {
            console.error(error.response?.data || error.message);
        }
    }

    return await fetchData();  


}

// Change it

// const waiting = async(timer)=>{
//     setTimeout(()=>{
//         return 1;
//     },timer)
// }

const waiting = (timer) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timer);
    });
};

const submitToken = async (resultToken)=>{

        const options = {
        method: 'GET',
        url: process.env.JUDGE_URL,
        params: {
            tokens: resultToken.join(","),  // convert token array into string with comma sep(syntax)
            base64_encoded: true, // no need to decode 
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE_KEY,
            'x-rapidapi-host': process.env.JUDGE_HOST,
            'Content-Type': 'application/json'
        }
        };

        async function fetchData() {
            try {
                const response = await axios.request(options);
                return response.data; // it return submissions array (not submission) jisme bohot kch hota h status_id,lang ,err etc etc
            } catch (error) {
                console.error(error);
            }
        }


    while(true){
    const results = await fetchData(); // ho skta h status_id 1 2 4 5 6 aisa aaye
                                      // therefore check krna padega
    if (!results) {
            throw new Error("Failed to fetch Judge0 result");
        }
    
    const IsResultObtained = results.submissions.every((r)=>r.status_id>2)
    
    if(IsResultObtained)
        return results.submissions;

    await waiting(1000); // wait for 1 second (if status_id<2)
}
        
}

module.exports = {getLanguageById , submitBatch , submitToken};



