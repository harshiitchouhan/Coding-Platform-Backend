const validator = require("validator");

const validate = (data) => {

    const MandatoryField = ["name", "email", "password"];
    const isAllowed = MandatoryField.every((k) =>
        Object.keys(data).includes(k)
    );

    if (!isAllowed)
        throw new Error("All fields are required");

    if (!validator.isEmail(data.email))
        throw new Error("Invalid Email");

    if (!validator.isStrongPassword(data.password))
        throw new Error("Password must include uppercase, lowercase, number, and special character");
};

module.exports = validate;