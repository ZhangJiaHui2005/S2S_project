import { BadRequestException } from '@nestjs/common';

export function normalizeAdminEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException('Email quản trị không hợp lệ.');
  }
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('Email quản trị không hợp lệ.');
  }
  return email;
}

export function validateAdminPassword(value: unknown, isNew = false): string {
  // bcrypt truncates passwords after 72 bytes, including multi-byte characters.
  if (
    typeof value !== 'string' ||
    value.length < (isNew ? 8 : 1) ||
    Buffer.byteLength(value, 'utf8') > 72
  ) {
    throw new BadRequestException(
      isNew
        ? 'Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte UTF-8.'
        : 'Mật khẩu quản trị không hợp lệ.',
    );
  }
  return value;
}
