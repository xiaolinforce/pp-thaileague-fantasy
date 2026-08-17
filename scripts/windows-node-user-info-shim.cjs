/* eslint-disable @typescript-eslint/no-require-imports */
// Some constrained Windows environments can fail uv_os_get_passwd even when
// USERNAME is available. Drizzle Kit loads tsx, which only needs the username
// to create a namespaced temporary directory.
const os = require("node:os");

const originalUserInfo = os.userInfo;

os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch (error) {
    if (error && error.code === "ERR_SYSTEM_ERROR") {
      return {
        uid: -1,
        gid: -1,
        username: process.env.USERNAME || "codex",
        homedir: process.env.USERPROFILE || process.cwd(),
        shell: null,
      };
    }
    throw error;
  }
};
