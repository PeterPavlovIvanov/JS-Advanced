export const appKey = "kid_ByINBdU6r";
export const appSecret = "9c57a27ba2d9430994729e4ad10f2257";

function saveData(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function getData(key){
  return sessionStorage.getItem(key);
}

export function saveUser(data){
  saveData("userInfo",data);
  saveData("authToken", data._kmd.authtoken);
}

export function removeUser(){
  sessionStorage.clear();
}