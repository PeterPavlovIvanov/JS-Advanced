export const appKey = "kid_r19ekyd2B";
export const appSecret = "4932a8fe19784765b270376ee2e929da";

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