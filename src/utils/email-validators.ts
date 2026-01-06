const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const hasValidLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const isNotEmpty = (value: string | undefined): boolean => {
  return value?.trim() !== "";
};

export const isValidHtmlContent = (html: string): boolean => {
  return html?.trim().length > 10;
};

export const isValidBulkEmails = (to: string[]): boolean => {
  return to.length > 0 && to.every(isValidEmail);
};

export const isValidSenderEmail = (sender: string): boolean => {
  if (!sender) return false;
  return isValidEmail(sender);
};

export const isValidSubject = (subject: string | undefined): boolean => {
  return subject ? hasValidLength(subject, 5) : false;
};

export const validationMessages = {
  invalidEmail: "Invalid email format for recipient",
  invalidSenderEmail: "Invalid sender email format",
  missingField: "Field is missing or undefined: ",
  emptyContent: "Subject, text, and HTML content are required",
  invalidSubject: "Subject must have at least 5 characters",
  invalidHtmlContent: "HTML content must have at least 10 characters",
  invalidBulkEmails: "Invalid or empty recipient list",
};
