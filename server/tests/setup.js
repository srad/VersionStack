"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
const vitest_1 = require("vitest");
(0, vitest_1.beforeEach)(() => {
    tsyringe_1.container.clearInstances();
});
