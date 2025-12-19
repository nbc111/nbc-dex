// Type declarations for @uniswap/token-lists
// This file fixes TypeScript errors when importing from @uniswap/token-lists

declare module '@uniswap/token-lists' {
  export interface TokenInfo {
    readonly chainId: number;
    readonly address: string;
    readonly name: string;
    readonly decimals: number;
    readonly symbol: string;
    readonly logoURI?: string;
    readonly tags?: string[];
    readonly extensions?: {
      readonly [key: string]:
        | {
            [key: string]:
              | {
                  [key: string]: string | number | boolean | null | undefined;
                }
              | string
              | number
              | boolean
              | null
              | undefined;
          }
        | string
        | number
        | boolean
        | null
        | undefined;
    };
  }

  export interface Version {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
  }

  export interface Tags {
    readonly [tagId: string]: {
      readonly name: string;
      readonly description: string;
    };
  }

  export interface TokenList {
    readonly name: string;
    readonly timestamp: string;
    readonly version: Version;
    readonly tokens: TokenInfo[];
    readonly tokenMap?: {
      readonly [key: string]: TokenInfo;
    };
    readonly keywords?: string[];
    readonly tags?: Tags;
    readonly logoURI?: string;
  }

  export enum VersionUpgrade {
    NONE,
    PATCH,
    MINOR,
    MAJOR,
  }

  export interface TokenListDiff {
    readonly added: TokenInfo[];
    readonly removed: TokenInfo[];
    readonly changed: {
      [chainId: number]: {
        [address: string]: Array<Exclude<keyof TokenInfo, 'address' | 'chainId'>>;
      };
    };
  }

  export function diffTokenLists(
    base: TokenInfo[],
    update: TokenInfo[]
  ): TokenListDiff;

  export function getVersionUpgrade(
    base: Version,
    update: Version
  ): VersionUpgrade;

  export function minVersionBump(
    baseList: TokenInfo[],
    updatedList: TokenInfo[]
  ): VersionUpgrade;

  export function versionComparator(
    versionA: Version,
    versionB: Version
  ): -1 | 0 | 1;

  export const schema: any;
}

