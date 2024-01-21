export function validateParam<T extends object>(params: T, paramName: keyof T) {
  if (!params[paramName]) {
    const errorMessage = `Missing ${String(paramName)} for GET request`;
    return {
      error: errorMessage,
      status: 400,
    };
  }
  // If the parameter exists, you can return it or perform other actions as needed
  return params[paramName];
}
