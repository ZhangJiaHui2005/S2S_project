import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';

const importDependency = createRequire(import.meta.url);

function load(relativePath, mocks = {}) {
  const file = path.resolve(relativePath);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const testModule = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => name in mocks ? mocks[name] : importDependency(name), testModule, testModule.exports,
  );
  return testModule.exports;
}

const redirect = (destination) => { throw Object.assign(new Error('redirect'), { destination }); };

for (const [url, cookie] of [
  ['/dang-nhap', 'better-auth.session_token=invalid'],
  ['/dang-ky', 'better-auth.session_token=invalid'],
  ['/admin/login', 's2s_admin_token=invalid'],
]) {
  test(`proxy leaves ${url} accessible with stale cookie`, async () => {
    const cookies = await import('better-auth/cookies');
    const { proxy } = load('proxy.ts', { 'better-auth/cookies': cookies });
    const response = proxy(new NextRequest(`http://localhost:3000${url}`, {
      headers: { cookie, 'x-pathname': '/admin' },
    }));
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('x-middleware-request-x-pathname'), url);
  });
}

test('proxy still redirects anonymous protected-page requests', async () => {
  const cookies = await import('better-auth/cookies');
  const { proxy } = load('proxy.ts', { 'better-auth/cookies': cookies });
  for (const [url, destination] of [['/profile', '/dang-nhap'], ['/admin', '/admin/login']]) {
    const result = proxy(new NextRequest(`http://localhost:3000${url}`));
    assert.equal(new URL(result.headers.get('location')).pathname, destination);
  }
});

for (const [file, destination, admin] of [
  ['app/dang-nhap/page.tsx', '/profile', false],
  ['app/dang-ky/page.tsx', '/profile', false],
  ['app/admin/login/page.tsx', '/admin', true],
]) {
  test(`${file} redirects only after the server validates the session`, async () => {
    let session = null;
    const component = () => null;
    const page = load(file, {
      'next/navigation': { redirect },
      '@/lib/session': { getCurrentSession: async () => session },
      '@/lib/admin-session': { getAdminSession: async () => session },
      '@/components/auth/auth-card': { AuthCard: component },
      '@/components/auth/login-form': { LoginForm: component },
      '@/components/auth/register-form': { RegisterForm: component },
      '@/components/admin/admin-login-form': { AdminLoginForm: component },
    }).default;
    assert.ok(await page());
    session = admin ? { adminId: 1 } : { user: { id: 'valid' } };
    await assert.rejects(page(), (error) => error.destination === destination);
  });
}
