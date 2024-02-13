const jwt = require("jsonwebtoken");
require("dotenv").config();

function jwtGenerator(user_id, email, store_id, supervisor,user_name) {
  const payload = {
    user: { 
      id: user_id,
      user_name:user_name,
      user_email:email,
      store_id:store_id,
      supervisor:supervisor,
     },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1hr" });
}

module.exports = jwtGenerator;