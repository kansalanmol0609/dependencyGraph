console.log("From JS file!");

const getData = async () => {
    const URL = `${window.location.href}getChunksdata`;
    console.log(URL);
    const response = await fetch(URL);
    console.log(response);
    const jsonData = await response.json();
    console.log(jsonData);
    return jsonData;
};

console.log(getData());