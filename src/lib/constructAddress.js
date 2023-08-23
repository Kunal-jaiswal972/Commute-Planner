export default function constructAddress(tags) {
  const address = [];
  const info = [];
  let name = "";

  for (const key in tags) {
    if (tags.hasOwnProperty(key)) {
      if (key.startsWith("addr:")) {
        address.push(tags[key]);
      } else if (key == "name") {
        name = tags[key];
      } else {
        info.push(`${key}: ${tags[key]} \n`);
      }
    }
  }

  return [address.join(", "), name, info];
}
