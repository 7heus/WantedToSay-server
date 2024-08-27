require("dotenv").config();

class Secure {
  #keyValidation(dataLength, key) {
    let validKey = key;
    while (validKey.length < dataLength) {
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

  // cyrb53(str, seed = 0) {
  //   let h1 = 0xd33db344f ^ seed,
  //     h2 = 0x41c6ce57 ^ seed;
  //   for (let i = 0, ch; i < str.length; i++) {
  //     ch = str.charCodeAt(i);
  //     h1 = Math.imul(h1 ^ ch, 2654435761);
  //     h2 = Math.imul(h2 ^ ch, 1597334677);
  //   }
  //   h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  //   h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  //   h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  //   h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  //   return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  // }
}

module.exports = Secure;
