export const appKey = "kid_HyeruCu6B";
export const appSecret = "5d22caf33a2d459c86b4e600a776f177";

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