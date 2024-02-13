const router = require("express").Router();
const pool = require("./db");
const bcrypt = require("bcrypt");
const authorize = require("./authorize");
const validInfo = require("./validInfo");
const validateForm = require("./validateInput");
const jwtGenerator = require("./jwtGenerator");
//registering

router.post("/register", async (req, res) => {
  try {
    const {
      user_name,
      user_email,
      user_password,
      supervisor_name,
      store_name,
      store_id,
    } = req.body;
    const user = await pool.query(
      `SELECT * FROM USERS WHERE USER_EMAIL = '${user_email}';`
    );
    if (user.rows.length != 0) {
      return res.status(401).send({ message: "User Already Registered" });
    }
    validation = validateForm(
      user_email,
      user_password,
      user_name,
      store_name,
      supervisor_name
    );
    if (!validation.type) {
      return res.status(401).send({ message: validation.value });
    }
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(user_password, salt);
    const newUser =
      await pool.query(`INSERT INTO USERS (user_name, user_email, user_password, supervisor, store_name, store_id) VALUES
    ('${user_name}','${user_email}','${bcryptPassword}', '${supervisor_name}','${store_name}', '${store_id}') RETURNING *;`);

    const token = jwtGenerator(
      newUser.rows[0]["user_id"],
      newUser.rows[0]["user_email"],
      newUser.rows[0]["store_id"],
      newUser.rows[0]["supervisor"],
      newUser.rows[0]["user_name"]
    );
    return res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server Error" });
  }
});

router.post("/login", validInfo, async (req, res) => {
  const { user_email, user_password } = req.body;
  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE user_email = $1;",
      [user_email]
    );
    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid Credential" });
    }

    const validPassword = await bcrypt.compare(
      user_password,
      user.rows[0].user_password
    );
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid Credential" });
    }
    const jwtToken = jwtGenerator(
      user.rows[0]["user_id"],
      user.rows[0]["user_email"],
      user.rows[0]["store_id"],
      user.rows[0]["supervisor"],
      user.rows[0]["user_name"]
    );
    return res.json({ jwtToken });
  } catch (err) {
    // console.error(err.message);
    res.status(500).send({ message: "Server error" });
  }
});

router.post("/verify", authorize, (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/get_name", authorize, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT user_email, user_name,store_id, supervisor FROM users WHERE user_id = $1",
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
