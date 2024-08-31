// Data encryption and decryption allowing security for users information:
// Encryption of information before storage and trasmission
// Decrytpion of information when used by authorized users


require("dotenv").config(); // load keys from ".env" file

class Secure {fin
  #keyValidation(dataLength, key) { // "#" means private methods or name. Private methods are only accessible within the class they are defined.
    while (validKey.length < dataLength) { //  ensuring that the encryption key has a length that matches the length of the data being processed
      validKey += key;
    }
    return validKey.slice(0, dataLength);
  }

  #doubleCrypt(encrypt) {
    const extraEncryptData = [];
    const secretKey = process.env.ENCRYPT_KEY;

    for (let i = 0; i < encrypt.length; i++) {
      extraEncryptData.push(encrypt[i] ^ secretKey.charCodeAt(i));
    }

    return extraEncryptData;
  }

  encryptData(data, key) {
    const validKey = this.#keyValidation(data.length, key);
    const encryptData = [];

    for (let i = 0; i < data.length; i++) {
      const dataCode = data.charCodeAt(i);
      const keyCharCode = validKey.charCodeAt(i);
      const encryptedCode = dataCode ^ keyCharCode;

      encryptData.push(encryptedCode);
    }

    return btoa(btoa(this.#doubleCrypt(encryptData).join(" ")));
  }

  decryptData(data, key) {
    const validData = atob(atob(data)).split(" ").map(Number);
    const encryptData = this.#doubleCrypt(validData);
    const validKey = this.#keyValidation(encryptData.length, key);
    const decryptedData = [];

    for (let i = 0; i < encryptData.length; i++) {
      const encryptedCode = encryptData[i];
      const keyCharCode = validKey.charCodeAt(i);
      const decryptedCode = encryptedCode ^ keyCharCode;
      const decryptedChar = String.fromCharCode(decryptedCode);

      decryptedData.push(decryptedChar);
    }

    return decryptedData.join("");
  }
}

module.exports = Secure;
