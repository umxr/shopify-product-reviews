type ValidateUserOts = {
  name: string;
  email: string;
  shop: string;
};

export function validateUser(data: ValidateUserOts) {
  const errors: Record<string, string> = {};

  if (!data.name) {
    errors.name = "Name is required";
  }

  if (!data.email) {
    errors.email = "Email is required";
  }

  if (!data.shop) {
    errors.shop = "Shop is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
