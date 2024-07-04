import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
if(args.length !== 1) {
    throw "参数错误，正确示例: node index.mjs {AListToken}\n AListToken:AListToken设置里查看";
}
const AListToken = args[0];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {owner,name,dir,AListUrl} = JSON.parse(readFileSync(`${__dirname}/filesConfig.json`,"utf8"));
const AListStorageConfig = JSON.parse(readFileSync(`${__dirname}/AListStorageConfig.json`,"utf8"));

async function getOneTag(tag){
    console.log("tag:"+tag);
    const tagInfo = await fetch(`https://api.github.com/repos/${owner}/${name}/releases/tags/${tag}`);
    if(!tagInfo.ok){
        throw "请求错误：\n"+tagInfo.url+"\n"+tagInfo.statusText+"\n"+await tagInfo.text();
    }
    const tagInfoData = await tagInfo.json();
    const { assets } = tagInfoData;
    const list = []
    for(const {name,size,browser_download_url} of assets){
        list.push(name+":"+size+":"+browser_download_url);
        console.log(name+":"+size+":"+browser_download_url);
    }
    return list;
}
async function getDirUrls(uDir){
    const dirUrls = {};
    for(const dirName in uDir){
        const tag = uDir[dirName];
        dirUrls[dirName] = await getOneTag(tag);
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
const treeUrls = await getDirUrls(dir)
console.log("创建树配置...");
const tree = toTree(treeUrls);
console.log(tree);
console.log("更新到AList...");
await updateAList(tree)
console.log("完成...");












