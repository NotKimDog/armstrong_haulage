declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.module.css";
declare module "*.module.scss";
declare module "*.module.sass";

// Explicitly declare app globals import to satisfy TypeScript side-effect import checks
declare module "../app/globals.css";
declare module "../globals.css";

export {};
