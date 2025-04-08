import { readFile } from "fs/promises";

const FIX_TYPE_INDEX = 19;
const FIX_TYPE_LENGTH = 3;
const FIX_TYPE_NAVAID = "K40";

const FIX_NAME_INDEX = 13;
const FIX_NAME_LENGTH = 5;

function dmsToDec(dms: string) {
  const direction = dms.slice(0, 1);
  let degrees: number, minutes: number, seconds: number;
  if (direction === "N" || direction === "S") {
    degrees = parseInt(dms.slice(1, 1 + 2), 10);
    minutes = parseInt(dms.slice(3, 3 + 2), 10);
    seconds = parseInt(dms.slice(5, 5 + 4), 10) / 100;
  } else {
    degrees = parseInt(dms.slice(1, 1 + 3), 10);
    minutes = parseInt(dms.slice(4, 4 + 2), 10);
    seconds = parseInt(dms.slice(6, 6 + 4), 10) / 100;
  }

  console.log(direction, degrees, minutes, seconds);

  let dec = degrees + minutes / 60 + seconds / 3600;

  if (direction === "W" || direction === "S") {
    dec = dec * -1;
  }

  return dec;
}

async function main() {
  const searchFixes = process.argv.slice(2);

  if (!searchFixes || searchFixes.length === 0) {
    return;
  }

  const file = await readFile("/Users/keith/Downloads/CIFP_250417/FAACIFP18");
  const lines = file.toString().split("\r\n");

  const fixes = lines.filter(
    (l) =>
      l.substring(FIX_TYPE_INDEX, FIX_TYPE_INDEX + FIX_TYPE_LENGTH) ===
        FIX_TYPE_NAVAID &&
      l
        .substring(FIX_NAME_INDEX, FIX_NAME_INDEX + FIX_NAME_LENGTH)
        .match(new RegExp(`(${searchFixes.join("|")})`))
  );

  const found = searchFixes.map((search) => {
    const fix = fixes.find(
      (f) =>
        f.substring(FIX_NAME_INDEX, FIX_NAME_INDEX + FIX_NAME_LENGTH).trim() ===
        search
    );
    if (!fix) {
      return;
    }

    const long = fix?.match(/([EW][0-9]{9})/)?.[1];
    const lat = fix?.match(/([NS][0-9]{8})/)?.[1];
    if (!long || !lat) {
      return;
    }

    return [dmsToDec(long), dmsToDec(lat)];
  });

  console.log(found);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
