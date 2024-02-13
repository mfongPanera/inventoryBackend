
module.exports =function(email, password,user_name, store_name, supervisor){
    if (!email && !password && !store_name && !supervisor) {
        return {type:false, value:"All fields are empty"};
      }
      if (email.length == 0) {
        
        return {type:false, value:"Email is left empty"};
      }
      if (!email.includes("@") || !email.includes(".")) {
        return {type:false, value:"Email format is incorrect"};
      }
      if (password.length < 8) {
        return {type:false, value:"Password needs have minimum 8 characters"};
      }
      let countUpperCase = 0;
      let countLowerCase = 0;
      let countDigit = 0;
      let countSpecialCharacters = 0;
  
      for (let i = 0; i < password.length; i++) {
        const specialChars = [
          "!",
          "@",
          "#",
          "$",
          "%",
          "^",
          "&",
          "*",
          "(",
          ")",
          "_",
          "-",
          "+",
          "=",
          "[",
          "{",
          "]",
          "}",
          ":",
          ";",
          "<",
          ">",
        ];
  
        if (specialChars.includes(password[i])) {
          // this means that the character is special, so increment countSpecialCharacters
          countSpecialCharacters++;
        } else if (!isNaN(password[i] * 1)) {
          // this means that the character is a digit, so increment countDigit
          countDigit++;
        } else {
          if (password[i] == password[i].toUpperCase()) {
            // this means that the character is an upper case character, so increment countUpperCase
            countUpperCase++;
          }
          if (password[i] == password[i].toLowerCase()) {
            // this means that the character is lowercase, so increment countUpperCase
            countLowerCase++;
          }
        }
      }
  
      if (countLowerCase == 0) {
        // invalid form, 0 lowercase characters
        return {type:false, value:"No Lower Case characters found in password"};
      }
  
      if (countUpperCase == 0) {
        // invalid form, 0 upper case characters
        return {type:false, value:"No Upper Case Characters found in password"};
      }
  
      if (countDigit == 0) {
        // invalid form, 0 digit characters
        return {type:false, value: "No Digits found in password"}
      }
  
      if (countSpecialCharacters == 0) {
        // invalid form, 0 special characters characters

         return { type: false,
          value: "Invalid Form, 0 special characters in password"}
      }
      if (!user_name) {
        return { type: false, value: "Username Empty" }
      }
  
      if (!supervisor) {
        return { type: false, value: "No Supervisor Selected" }
      }
      if (!store_name) {
        return { type: false, value: "Select store" }
      }
      return {type:true, value:"Valid Form"}
}