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
    const list = [];
    for(const releases of releasesList){
        const {tag_name,assets} = releases;
        for (const {name,size,browser_download_url} of assets){
            list.push({path:tag_name+"/"+name,url:browser_download_url,size});
        }
    }
    return list;
}
function toTree(dirUrls){
    function addToObj(obj,path,url,size){
        const theIndex = path.indexOf("/");
        if(theIndex<0){
            obj[path] = `:${size}:${url}`;
            return;
        }
        const left = path.substring(0,theIndex)
        const right = path.substring(theIndex+1);
        if(!obj[left]){
            obj[left] = {};
        }
        addToObj(obj[left],right,url,size);
    }
    const fileobj = {};
    for(const {path,url,size} of dirUrls){
        addToObj(fileobj,path,url,size);
    }
    function getTree(left,treeObj){
        let leftString = ``
        for(let i=0;i<left;i++){
            leftString += '  ';
        }
        let treeString = '';
        for(const key in treeObj){
            const value = treeObj[key];
            if((typeof value)=="string"){
                treeString += leftString+key+value+'\n';
            }else if(left===0 && key==="root"){
                treeString += getTree(left,value);
            } else{
                treeString += leftString+key+':\n'
                treeString += getTree(left+1,value);
            }
        }
        return treeString;
    }
    return getTree(0,fileobj);
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












