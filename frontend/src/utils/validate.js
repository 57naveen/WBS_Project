export const checkValidateData = (email, password) =>{
    const isEmailValid = /^[a-zA-Z0-9_.±]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/.test(email);
    const isPasswordValid =/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(password) ;

    if(!isEmailValid) return  "Email ID is not Valid"
    if(!isPasswordValid) return "Password is not valid"

    return null;

}