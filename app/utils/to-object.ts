export const toObject = () => {
  return JSON.parse(
    JSON.stringify(
      this,
      (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
    )
  );
};
