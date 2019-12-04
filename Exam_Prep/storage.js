export const appKey = "kid_ryuRzIH6r";
export const appSecret = "4010ad7cb653419fa951c3d83e1fddb7";

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