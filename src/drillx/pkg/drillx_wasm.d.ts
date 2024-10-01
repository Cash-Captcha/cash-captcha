/* tslint:disable */
/* eslint-disable */
/**
* @param {WasmSolverMemory} memory
* @param {Uint8Array} challenge
* @param {Uint8Array} nonce
* @returns {any}
*/
export function hash_with_memory(memory: WasmSolverMemory, challenge: Uint8Array, nonce: Uint8Array): any;
/**
* @param {Uint8Array} challenge
* @param {Uint8Array} solution
* @returns {boolean}
*/
export function is_valid_solution(challenge: Uint8Array, solution: Uint8Array): boolean;
/**
* @param {Uint8Array} hash
* @returns {number}
*/
export function difficulty(hash: Uint8Array): number;
/**
*/
export class WasmSolverMemory {
  free(): void;
/**
*/
  constructor();
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmsolvermemory_free: (a: number) => void;
  readonly wasmsolvermemory_new: () => number;
  readonly hash_with_memory: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly is_valid_solution: (a: number, b: number, c: number, d: number) => number;
  readonly difficulty: (a: number, b: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
