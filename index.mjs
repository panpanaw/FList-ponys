import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';


const {AListToken,AListUrl,Owner,Repository} = process.env;
if (!AListToken)  throw '环境变量 AListToken 未定义!';
if (!AListUrl)  throw '环境变量 AListUrl 未定义!';
if (!Owner)  throw '环境变量 Owner 未定义!';
if (!Repository)  throw '环境变量 Repository 未定义!';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AListStorageConfig = JSON.parse(readFileSync(`${__dirname}/AListStorageConfig.json`,"utf8"));

async function getDirUrls(){
    const tagInfo = await fetch(`https://api.github.com/repos/${Owner}/${Repository}/releases`);
    if(!tagInfo.ok){
        throw "请求错误：\n"+tagInfo.url+"\n"+tagInfo.statusText+"\n"+await tagInfo.text();
    }
    const releasesList = await tagInfo.json();
    const dirUrls = {};
    for(const releases of releasesList){
        const {tag_name,assets} = releases;
        const list = [];
        for (const {name,size,browser_download_url} of assets){
            list.push(`${name}:${size}:${browser_download_url}`);
        }
        dirUrls[tag_name] = list;
    }
    return dirUrls;
}
function toTree(dirUrls){
    let rs = "";
    for(const dirName in dirUrls) {
        const urls = dirUrls[dirName];
        const trees = dirName.split("/");
        let treeString = ``;
        let left = '';
        for (const treeName of trees) {
            treeString += left + treeName + ":\n";
            left += `  `;
        }
        for (const url of urls) {
            treeString += left + url + "\n";
        }
        rs += treeString;
    }
    return rs;
}
async function updateAList(url_structure){
    const res = await fetch(`${AListUrl}/api/admin/storage/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': AListToken,
        },
        body: JSON.stringify({
            ...AListStorageConfig,
            "addition":JSON.stringify({
                ...AListStorageConfig.addition,
                "url_structure":url_structure
            })
        })
    })
    if(!res.ok){
        throw res.message;
    }
    const resData = await res.json();
    if(resData.code!==200){
        throw resData.message;
    }
}

console.log("获取发行版信息...");
const treeUrls = await getDirUrls()
console.log("创建树配置...");
const tree = toTree(treeUrls);
console.log(tree);
console.log("更新到AList...");
await updateAList(tree)
console.log("完成...");












