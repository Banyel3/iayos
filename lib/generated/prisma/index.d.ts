
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Accounts
 * 
 */
export type Accounts = $Result.DefaultSelection<Prisma.$AccountsPayload>
/**
 * Model Profile
 * 
 */
export type Profile = $Result.DefaultSelection<Prisma.$ProfilePayload>
/**
 * Model Worker_Profile
 * 
 */
export type Worker_Profile = $Result.DefaultSelection<Prisma.$Worker_ProfilePayload>
/**
 * Model Freelancer_Specialization
 * 
 */
export type Freelancer_Specialization = $Result.DefaultSelection<Prisma.$Freelancer_SpecializationPayload>
/**
 * Model Specialization
 * 
 */
export type Specialization = $Result.DefaultSelection<Prisma.$SpecializationPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const profileType: {
  WORKER: 'WORKER',
  CLIENT: 'CLIENT',
  BOTH: 'BOTH'
};

export type profileType = (typeof profileType)[keyof typeof profileType]


export const availabilityStatus: {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE'
};

export type availabilityStatus = (typeof availabilityStatus)[keyof typeof availabilityStatus]

}

export type profileType = $Enums.profileType

export const profileType: typeof $Enums.profileType

export type availabilityStatus = $Enums.availabilityStatus

export const availabilityStatus: typeof $Enums.availabilityStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Accounts
 * const accounts = await prisma.accounts.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Accounts
   * const accounts = await prisma.accounts.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.accounts`: Exposes CRUD operations for the **Accounts** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Accounts
    * const accounts = await prisma.accounts.findMany()
    * ```
    */
  get accounts(): Prisma.AccountsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.profile`: Exposes CRUD operations for the **Profile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Profiles
    * const profiles = await prisma.profile.findMany()
    * ```
    */
  get profile(): Prisma.ProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.worker_Profile`: Exposes CRUD operations for the **Worker_Profile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Worker_Profiles
    * const worker_Profiles = await prisma.worker_Profile.findMany()
    * ```
    */
  get worker_Profile(): Prisma.Worker_ProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.freelancer_Specialization`: Exposes CRUD operations for the **Freelancer_Specialization** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Freelancer_Specializations
    * const freelancer_Specializations = await prisma.freelancer_Specialization.findMany()
    * ```
    */
  get freelancer_Specialization(): Prisma.Freelancer_SpecializationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.specialization`: Exposes CRUD operations for the **Specialization** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Specializations
    * const specializations = await prisma.specialization.findMany()
    * ```
    */
  get specialization(): Prisma.SpecializationDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.15.0
   * Query Engine version: 85179d7826409ee107a6ba334b5e305ae3fba9fb
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Accounts: 'Accounts',
    Profile: 'Profile',
    Worker_Profile: 'Worker_Profile',
    Freelancer_Specialization: 'Freelancer_Specialization',
    Specialization: 'Specialization'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "accounts" | "profile" | "worker_Profile" | "freelancer_Specialization" | "specialization"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Accounts: {
        payload: Prisma.$AccountsPayload<ExtArgs>
        fields: Prisma.AccountsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AccountsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AccountsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>
          }
          findFirst: {
            args: Prisma.AccountsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AccountsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>
          }
          findMany: {
            args: Prisma.AccountsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>[]
          }
          create: {
            args: Prisma.AccountsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>
          }
          createMany: {
            args: Prisma.AccountsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AccountsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>[]
          }
          delete: {
            args: Prisma.AccountsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>
          }
          update: {
            args: Prisma.AccountsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>
          }
          deleteMany: {
            args: Prisma.AccountsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AccountsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AccountsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>[]
          }
          upsert: {
            args: Prisma.AccountsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountsPayload>
          }
          aggregate: {
            args: Prisma.AccountsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAccounts>
          }
          groupBy: {
            args: Prisma.AccountsGroupByArgs<ExtArgs>
            result: $Utils.Optional<AccountsGroupByOutputType>[]
          }
          count: {
            args: Prisma.AccountsCountArgs<ExtArgs>
            result: $Utils.Optional<AccountsCountAggregateOutputType> | number
          }
        }
      }
      Profile: {
        payload: Prisma.$ProfilePayload<ExtArgs>
        fields: Prisma.ProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          findFirst: {
            args: Prisma.ProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          findMany: {
            args: Prisma.ProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          create: {
            args: Prisma.ProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          createMany: {
            args: Prisma.ProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          delete: {
            args: Prisma.ProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          update: {
            args: Prisma.ProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          deleteMany: {
            args: Prisma.ProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          upsert: {
            args: Prisma.ProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          aggregate: {
            args: Prisma.ProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProfile>
          }
          groupBy: {
            args: Prisma.ProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProfileCountArgs<ExtArgs>
            result: $Utils.Optional<ProfileCountAggregateOutputType> | number
          }
        }
      }
      Worker_Profile: {
        payload: Prisma.$Worker_ProfilePayload<ExtArgs>
        fields: Prisma.Worker_ProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.Worker_ProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.Worker_ProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>
          }
          findFirst: {
            args: Prisma.Worker_ProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.Worker_ProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>
          }
          findMany: {
            args: Prisma.Worker_ProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>[]
          }
          create: {
            args: Prisma.Worker_ProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>
          }
          createMany: {
            args: Prisma.Worker_ProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.Worker_ProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>[]
          }
          delete: {
            args: Prisma.Worker_ProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>
          }
          update: {
            args: Prisma.Worker_ProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>
          }
          deleteMany: {
            args: Prisma.Worker_ProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.Worker_ProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.Worker_ProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>[]
          }
          upsert: {
            args: Prisma.Worker_ProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Worker_ProfilePayload>
          }
          aggregate: {
            args: Prisma.Worker_ProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorker_Profile>
          }
          groupBy: {
            args: Prisma.Worker_ProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<Worker_ProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.Worker_ProfileCountArgs<ExtArgs>
            result: $Utils.Optional<Worker_ProfileCountAggregateOutputType> | number
          }
        }
      }
      Freelancer_Specialization: {
        payload: Prisma.$Freelancer_SpecializationPayload<ExtArgs>
        fields: Prisma.Freelancer_SpecializationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.Freelancer_SpecializationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.Freelancer_SpecializationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>
          }
          findFirst: {
            args: Prisma.Freelancer_SpecializationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.Freelancer_SpecializationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>
          }
          findMany: {
            args: Prisma.Freelancer_SpecializationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>[]
          }
          create: {
            args: Prisma.Freelancer_SpecializationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>
          }
          createMany: {
            args: Prisma.Freelancer_SpecializationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.Freelancer_SpecializationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>[]
          }
          delete: {
            args: Prisma.Freelancer_SpecializationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>
          }
          update: {
            args: Prisma.Freelancer_SpecializationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>
          }
          deleteMany: {
            args: Prisma.Freelancer_SpecializationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.Freelancer_SpecializationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.Freelancer_SpecializationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>[]
          }
          upsert: {
            args: Prisma.Freelancer_SpecializationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Freelancer_SpecializationPayload>
          }
          aggregate: {
            args: Prisma.Freelancer_SpecializationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFreelancer_Specialization>
          }
          groupBy: {
            args: Prisma.Freelancer_SpecializationGroupByArgs<ExtArgs>
            result: $Utils.Optional<Freelancer_SpecializationGroupByOutputType>[]
          }
          count: {
            args: Prisma.Freelancer_SpecializationCountArgs<ExtArgs>
            result: $Utils.Optional<Freelancer_SpecializationCountAggregateOutputType> | number
          }
        }
      }
      Specialization: {
        payload: Prisma.$SpecializationPayload<ExtArgs>
        fields: Prisma.SpecializationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpecializationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpecializationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>
          }
          findFirst: {
            args: Prisma.SpecializationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpecializationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>
          }
          findMany: {
            args: Prisma.SpecializationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>[]
          }
          create: {
            args: Prisma.SpecializationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>
          }
          createMany: {
            args: Prisma.SpecializationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpecializationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>[]
          }
          delete: {
            args: Prisma.SpecializationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>
          }
          update: {
            args: Prisma.SpecializationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>
          }
          deleteMany: {
            args: Prisma.SpecializationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpecializationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SpecializationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>[]
          }
          upsert: {
            args: Prisma.SpecializationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpecializationPayload>
          }
          aggregate: {
            args: Prisma.SpecializationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpecialization>
          }
          groupBy: {
            args: Prisma.SpecializationGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpecializationGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpecializationCountArgs<ExtArgs>
            result: $Utils.Optional<SpecializationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    accounts?: AccountsOmit
    profile?: ProfileOmit
    worker_Profile?: Worker_ProfileOmit
    freelancer_Specialization?: Freelancer_SpecializationOmit
    specialization?: SpecializationOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type AccountsCountOutputType
   */

  export type AccountsCountOutputType = {
    profile: number
  }

  export type AccountsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | AccountsCountOutputTypeCountProfileArgs
  }

  // Custom InputTypes
  /**
   * AccountsCountOutputType without action
   */
  export type AccountsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AccountsCountOutputType
     */
    select?: AccountsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AccountsCountOutputType without action
   */
  export type AccountsCountOutputTypeCountProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProfileWhereInput
  }


  /**
   * Count Type Worker_ProfileCountOutputType
   */

  export type Worker_ProfileCountOutputType = {
    freelancer_specialization: number
  }

  export type Worker_ProfileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    freelancer_specialization?: boolean | Worker_ProfileCountOutputTypeCountFreelancer_specializationArgs
  }

  // Custom InputTypes
  /**
   * Worker_ProfileCountOutputType without action
   */
  export type Worker_ProfileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_ProfileCountOutputType
     */
    select?: Worker_ProfileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * Worker_ProfileCountOutputType without action
   */
  export type Worker_ProfileCountOutputTypeCountFreelancer_specializationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Freelancer_SpecializationWhereInput
  }


  /**
   * Count Type SpecializationCountOutputType
   */

  export type SpecializationCountOutputType = {
    freelancer_specialization: number
  }

  export type SpecializationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    freelancer_specialization?: boolean | SpecializationCountOutputTypeCountFreelancer_specializationArgs
  }

  // Custom InputTypes
  /**
   * SpecializationCountOutputType without action
   */
  export type SpecializationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpecializationCountOutputType
     */
    select?: SpecializationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SpecializationCountOutputType without action
   */
  export type SpecializationCountOutputTypeCountFreelancer_specializationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Freelancer_SpecializationWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Accounts
   */

  export type AggregateAccounts = {
    _count: AccountsCountAggregateOutputType | null
    _avg: AccountsAvgAggregateOutputType | null
    _sum: AccountsSumAggregateOutputType | null
    _min: AccountsMinAggregateOutputType | null
    _max: AccountsMaxAggregateOutputType | null
  }

  export type AccountsAvgAggregateOutputType = {
    accountID: number | null
  }

  export type AccountsSumAggregateOutputType = {
    accountID: number | null
  }

  export type AccountsMinAggregateOutputType = {
    accountID: number | null
    email: string | null
    password: string | null
    isVerified: boolean | null
    createdAt: Date | null
    status: string | null
  }

  export type AccountsMaxAggregateOutputType = {
    accountID: number | null
    email: string | null
    password: string | null
    isVerified: boolean | null
    createdAt: Date | null
    status: string | null
  }

  export type AccountsCountAggregateOutputType = {
    accountID: number
    email: number
    password: number
    isVerified: number
    createdAt: number
    status: number
    _all: number
  }


  export type AccountsAvgAggregateInputType = {
    accountID?: true
  }

  export type AccountsSumAggregateInputType = {
    accountID?: true
  }

  export type AccountsMinAggregateInputType = {
    accountID?: true
    email?: true
    password?: true
    isVerified?: true
    createdAt?: true
    status?: true
  }

  export type AccountsMaxAggregateInputType = {
    accountID?: true
    email?: true
    password?: true
    isVerified?: true
    createdAt?: true
    status?: true
  }

  export type AccountsCountAggregateInputType = {
    accountID?: true
    email?: true
    password?: true
    isVerified?: true
    createdAt?: true
    status?: true
    _all?: true
  }

  export type AccountsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Accounts to aggregate.
     */
    where?: AccountsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountsOrderByWithRelationInput | AccountsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AccountsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Accounts
    **/
    _count?: true | AccountsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AccountsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AccountsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AccountsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AccountsMaxAggregateInputType
  }

  export type GetAccountsAggregateType<T extends AccountsAggregateArgs> = {
        [P in keyof T & keyof AggregateAccounts]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAccounts[P]>
      : GetScalarType<T[P], AggregateAccounts[P]>
  }




  export type AccountsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountsWhereInput
    orderBy?: AccountsOrderByWithAggregationInput | AccountsOrderByWithAggregationInput[]
    by: AccountsScalarFieldEnum[] | AccountsScalarFieldEnum
    having?: AccountsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AccountsCountAggregateInputType | true
    _avg?: AccountsAvgAggregateInputType
    _sum?: AccountsSumAggregateInputType
    _min?: AccountsMinAggregateInputType
    _max?: AccountsMaxAggregateInputType
  }

  export type AccountsGroupByOutputType = {
    accountID: number
    email: string
    password: string
    isVerified: boolean
    createdAt: Date
    status: string
    _count: AccountsCountAggregateOutputType | null
    _avg: AccountsAvgAggregateOutputType | null
    _sum: AccountsSumAggregateOutputType | null
    _min: AccountsMinAggregateOutputType | null
    _max: AccountsMaxAggregateOutputType | null
  }

  type GetAccountsGroupByPayload<T extends AccountsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AccountsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AccountsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AccountsGroupByOutputType[P]>
            : GetScalarType<T[P], AccountsGroupByOutputType[P]>
        }
      >
    >


  export type AccountsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    accountID?: boolean
    email?: boolean
    password?: boolean
    isVerified?: boolean
    createdAt?: boolean
    status?: boolean
    profile?: boolean | Accounts$profileArgs<ExtArgs>
    _count?: boolean | AccountsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["accounts"]>

  export type AccountsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    accountID?: boolean
    email?: boolean
    password?: boolean
    isVerified?: boolean
    createdAt?: boolean
    status?: boolean
  }, ExtArgs["result"]["accounts"]>

  export type AccountsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    accountID?: boolean
    email?: boolean
    password?: boolean
    isVerified?: boolean
    createdAt?: boolean
    status?: boolean
  }, ExtArgs["result"]["accounts"]>

  export type AccountsSelectScalar = {
    accountID?: boolean
    email?: boolean
    password?: boolean
    isVerified?: boolean
    createdAt?: boolean
    status?: boolean
  }

  export type AccountsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"accountID" | "email" | "password" | "isVerified" | "createdAt" | "status", ExtArgs["result"]["accounts"]>
  export type AccountsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | Accounts$profileArgs<ExtArgs>
    _count?: boolean | AccountsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AccountsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AccountsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AccountsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Accounts"
    objects: {
      profile: Prisma.$ProfilePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      accountID: number
      email: string
      password: string
      isVerified: boolean
      createdAt: Date
      status: string
    }, ExtArgs["result"]["accounts"]>
    composites: {}
  }

  type AccountsGetPayload<S extends boolean | null | undefined | AccountsDefaultArgs> = $Result.GetResult<Prisma.$AccountsPayload, S>

  type AccountsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AccountsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AccountsCountAggregateInputType | true
    }

  export interface AccountsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Accounts'], meta: { name: 'Accounts' } }
    /**
     * Find zero or one Accounts that matches the filter.
     * @param {AccountsFindUniqueArgs} args - Arguments to find a Accounts
     * @example
     * // Get one Accounts
     * const accounts = await prisma.accounts.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AccountsFindUniqueArgs>(args: SelectSubset<T, AccountsFindUniqueArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Accounts that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AccountsFindUniqueOrThrowArgs} args - Arguments to find a Accounts
     * @example
     * // Get one Accounts
     * const accounts = await prisma.accounts.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AccountsFindUniqueOrThrowArgs>(args: SelectSubset<T, AccountsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Accounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountsFindFirstArgs} args - Arguments to find a Accounts
     * @example
     * // Get one Accounts
     * const accounts = await prisma.accounts.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AccountsFindFirstArgs>(args?: SelectSubset<T, AccountsFindFirstArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Accounts that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountsFindFirstOrThrowArgs} args - Arguments to find a Accounts
     * @example
     * // Get one Accounts
     * const accounts = await prisma.accounts.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AccountsFindFirstOrThrowArgs>(args?: SelectSubset<T, AccountsFindFirstOrThrowArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Accounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Accounts
     * const accounts = await prisma.accounts.findMany()
     * 
     * // Get first 10 Accounts
     * const accounts = await prisma.accounts.findMany({ take: 10 })
     * 
     * // Only select the `accountID`
     * const accountsWithAccountIDOnly = await prisma.accounts.findMany({ select: { accountID: true } })
     * 
     */
    findMany<T extends AccountsFindManyArgs>(args?: SelectSubset<T, AccountsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Accounts.
     * @param {AccountsCreateArgs} args - Arguments to create a Accounts.
     * @example
     * // Create one Accounts
     * const Accounts = await prisma.accounts.create({
     *   data: {
     *     // ... data to create a Accounts
     *   }
     * })
     * 
     */
    create<T extends AccountsCreateArgs>(args: SelectSubset<T, AccountsCreateArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Accounts.
     * @param {AccountsCreateManyArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const accounts = await prisma.accounts.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AccountsCreateManyArgs>(args?: SelectSubset<T, AccountsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Accounts and returns the data saved in the database.
     * @param {AccountsCreateManyAndReturnArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const accounts = await prisma.accounts.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Accounts and only return the `accountID`
     * const accountsWithAccountIDOnly = await prisma.accounts.createManyAndReturn({
     *   select: { accountID: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AccountsCreateManyAndReturnArgs>(args?: SelectSubset<T, AccountsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Accounts.
     * @param {AccountsDeleteArgs} args - Arguments to delete one Accounts.
     * @example
     * // Delete one Accounts
     * const Accounts = await prisma.accounts.delete({
     *   where: {
     *     // ... filter to delete one Accounts
     *   }
     * })
     * 
     */
    delete<T extends AccountsDeleteArgs>(args: SelectSubset<T, AccountsDeleteArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Accounts.
     * @param {AccountsUpdateArgs} args - Arguments to update one Accounts.
     * @example
     * // Update one Accounts
     * const accounts = await prisma.accounts.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AccountsUpdateArgs>(args: SelectSubset<T, AccountsUpdateArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Accounts.
     * @param {AccountsDeleteManyArgs} args - Arguments to filter Accounts to delete.
     * @example
     * // Delete a few Accounts
     * const { count } = await prisma.accounts.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AccountsDeleteManyArgs>(args?: SelectSubset<T, AccountsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Accounts
     * const accounts = await prisma.accounts.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AccountsUpdateManyArgs>(args: SelectSubset<T, AccountsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Accounts and returns the data updated in the database.
     * @param {AccountsUpdateManyAndReturnArgs} args - Arguments to update many Accounts.
     * @example
     * // Update many Accounts
     * const accounts = await prisma.accounts.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Accounts and only return the `accountID`
     * const accountsWithAccountIDOnly = await prisma.accounts.updateManyAndReturn({
     *   select: { accountID: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AccountsUpdateManyAndReturnArgs>(args: SelectSubset<T, AccountsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Accounts.
     * @param {AccountsUpsertArgs} args - Arguments to update or create a Accounts.
     * @example
     * // Update or create a Accounts
     * const accounts = await prisma.accounts.upsert({
     *   create: {
     *     // ... data to create a Accounts
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Accounts we want to update
     *   }
     * })
     */
    upsert<T extends AccountsUpsertArgs>(args: SelectSubset<T, AccountsUpsertArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountsCountArgs} args - Arguments to filter Accounts to count.
     * @example
     * // Count the number of Accounts
     * const count = await prisma.accounts.count({
     *   where: {
     *     // ... the filter for the Accounts we want to count
     *   }
     * })
    **/
    count<T extends AccountsCountArgs>(
      args?: Subset<T, AccountsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AccountsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AccountsAggregateArgs>(args: Subset<T, AccountsAggregateArgs>): Prisma.PrismaPromise<GetAccountsAggregateType<T>>

    /**
     * Group by Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AccountsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AccountsGroupByArgs['orderBy'] }
        : { orderBy?: AccountsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AccountsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAccountsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Accounts model
   */
  readonly fields: AccountsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Accounts.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AccountsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    profile<T extends Accounts$profileArgs<ExtArgs> = {}>(args?: Subset<T, Accounts$profileArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Accounts model
   */
  interface AccountsFieldRefs {
    readonly accountID: FieldRef<"Accounts", 'Int'>
    readonly email: FieldRef<"Accounts", 'String'>
    readonly password: FieldRef<"Accounts", 'String'>
    readonly isVerified: FieldRef<"Accounts", 'Boolean'>
    readonly createdAt: FieldRef<"Accounts", 'DateTime'>
    readonly status: FieldRef<"Accounts", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Accounts findUnique
   */
  export type AccountsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where: AccountsWhereUniqueInput
  }

  /**
   * Accounts findUniqueOrThrow
   */
  export type AccountsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where: AccountsWhereUniqueInput
  }

  /**
   * Accounts findFirst
   */
  export type AccountsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where?: AccountsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountsOrderByWithRelationInput | AccountsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountsScalarFieldEnum | AccountsScalarFieldEnum[]
  }

  /**
   * Accounts findFirstOrThrow
   */
  export type AccountsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where?: AccountsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountsOrderByWithRelationInput | AccountsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountsScalarFieldEnum | AccountsScalarFieldEnum[]
  }

  /**
   * Accounts findMany
   */
  export type AccountsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where?: AccountsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountsOrderByWithRelationInput | AccountsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Accounts.
     */
    cursor?: AccountsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    distinct?: AccountsScalarFieldEnum | AccountsScalarFieldEnum[]
  }

  /**
   * Accounts create
   */
  export type AccountsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * The data needed to create a Accounts.
     */
    data: XOR<AccountsCreateInput, AccountsUncheckedCreateInput>
  }

  /**
   * Accounts createMany
   */
  export type AccountsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Accounts.
     */
    data: AccountsCreateManyInput | AccountsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Accounts createManyAndReturn
   */
  export type AccountsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * The data used to create many Accounts.
     */
    data: AccountsCreateManyInput | AccountsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Accounts update
   */
  export type AccountsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * The data needed to update a Accounts.
     */
    data: XOR<AccountsUpdateInput, AccountsUncheckedUpdateInput>
    /**
     * Choose, which Accounts to update.
     */
    where: AccountsWhereUniqueInput
  }

  /**
   * Accounts updateMany
   */
  export type AccountsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountsUpdateManyMutationInput, AccountsUncheckedUpdateManyInput>
    /**
     * Filter which Accounts to update
     */
    where?: AccountsWhereInput
    /**
     * Limit how many Accounts to update.
     */
    limit?: number
  }

  /**
   * Accounts updateManyAndReturn
   */
  export type AccountsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountsUpdateManyMutationInput, AccountsUncheckedUpdateManyInput>
    /**
     * Filter which Accounts to update
     */
    where?: AccountsWhereInput
    /**
     * Limit how many Accounts to update.
     */
    limit?: number
  }

  /**
   * Accounts upsert
   */
  export type AccountsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * The filter to search for the Accounts to update in case it exists.
     */
    where: AccountsWhereUniqueInput
    /**
     * In case the Accounts found by the `where` argument doesn't exist, create a new Accounts with this data.
     */
    create: XOR<AccountsCreateInput, AccountsUncheckedCreateInput>
    /**
     * In case the Accounts was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AccountsUpdateInput, AccountsUncheckedUpdateInput>
  }

  /**
   * Accounts delete
   */
  export type AccountsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
    /**
     * Filter which Accounts to delete.
     */
    where: AccountsWhereUniqueInput
  }

  /**
   * Accounts deleteMany
   */
  export type AccountsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Accounts to delete
     */
    where?: AccountsWhereInput
    /**
     * Limit how many Accounts to delete.
     */
    limit?: number
  }

  /**
   * Accounts.profile
   */
  export type Accounts$profileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    where?: ProfileWhereInput
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    cursor?: ProfileWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
  }

  /**
   * Accounts without action
   */
  export type AccountsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Accounts
     */
    select?: AccountsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Accounts
     */
    omit?: AccountsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountsInclude<ExtArgs> | null
  }


  /**
   * Model Profile
   */

  export type AggregateProfile = {
    _count: ProfileCountAggregateOutputType | null
    _avg: ProfileAvgAggregateOutputType | null
    _sum: ProfileSumAggregateOutputType | null
    _min: ProfileMinAggregateOutputType | null
    _max: ProfileMaxAggregateOutputType | null
  }

  export type ProfileAvgAggregateOutputType = {
    profileID: number | null
    accountID: number | null
  }

  export type ProfileSumAggregateOutputType = {
    profileID: number | null
    accountID: number | null
  }

  export type ProfileMinAggregateOutputType = {
    profileID: number | null
    accountID: number | null
    firstName: string | null
    lastName: string | null
    username: string | null
    contactNum: string | null
    profileType: $Enums.profileType | null
  }

  export type ProfileMaxAggregateOutputType = {
    profileID: number | null
    accountID: number | null
    firstName: string | null
    lastName: string | null
    username: string | null
    contactNum: string | null
    profileType: $Enums.profileType | null
  }

  export type ProfileCountAggregateOutputType = {
    profileID: number
    accountID: number
    firstName: number
    lastName: number
    username: number
    contactNum: number
    profileType: number
    _all: number
  }


  export type ProfileAvgAggregateInputType = {
    profileID?: true
    accountID?: true
  }

  export type ProfileSumAggregateInputType = {
    profileID?: true
    accountID?: true
  }

  export type ProfileMinAggregateInputType = {
    profileID?: true
    accountID?: true
    firstName?: true
    lastName?: true
    username?: true
    contactNum?: true
    profileType?: true
  }

  export type ProfileMaxAggregateInputType = {
    profileID?: true
    accountID?: true
    firstName?: true
    lastName?: true
    username?: true
    contactNum?: true
    profileType?: true
  }

  export type ProfileCountAggregateInputType = {
    profileID?: true
    accountID?: true
    firstName?: true
    lastName?: true
    username?: true
    contactNum?: true
    profileType?: true
    _all?: true
  }

  export type ProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Profile to aggregate.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Profiles
    **/
    _count?: true | ProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProfileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProfileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProfileMaxAggregateInputType
  }

  export type GetProfileAggregateType<T extends ProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProfile[P]>
      : GetScalarType<T[P], AggregateProfile[P]>
  }




  export type ProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProfileWhereInput
    orderBy?: ProfileOrderByWithAggregationInput | ProfileOrderByWithAggregationInput[]
    by: ProfileScalarFieldEnum[] | ProfileScalarFieldEnum
    having?: ProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProfileCountAggregateInputType | true
    _avg?: ProfileAvgAggregateInputType
    _sum?: ProfileSumAggregateInputType
    _min?: ProfileMinAggregateInputType
    _max?: ProfileMaxAggregateInputType
  }

  export type ProfileGroupByOutputType = {
    profileID: number
    accountID: number
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType: $Enums.profileType | null
    _count: ProfileCountAggregateOutputType | null
    _avg: ProfileAvgAggregateOutputType | null
    _sum: ProfileSumAggregateOutputType | null
    _min: ProfileMinAggregateOutputType | null
    _max: ProfileMaxAggregateOutputType | null
  }

  type GetProfileGroupByPayload<T extends ProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProfileGroupByOutputType[P]>
            : GetScalarType<T[P], ProfileGroupByOutputType[P]>
        }
      >
    >


  export type ProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    profileID?: boolean
    accountID?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    contactNum?: boolean
    profileType?: boolean
    worker?: boolean | Profile$workerArgs<ExtArgs>
    accounts?: boolean | AccountsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    profileID?: boolean
    accountID?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    contactNum?: boolean
    profileType?: boolean
    accounts?: boolean | AccountsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    profileID?: boolean
    accountID?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    contactNum?: boolean
    profileType?: boolean
    accounts?: boolean | AccountsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectScalar = {
    profileID?: boolean
    accountID?: boolean
    firstName?: boolean
    lastName?: boolean
    username?: boolean
    contactNum?: boolean
    profileType?: boolean
  }

  export type ProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"profileID" | "accountID" | "firstName" | "lastName" | "username" | "contactNum" | "profileType", ExtArgs["result"]["profile"]>
  export type ProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    worker?: boolean | Profile$workerArgs<ExtArgs>
    accounts?: boolean | AccountsDefaultArgs<ExtArgs>
  }
  export type ProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | AccountsDefaultArgs<ExtArgs>
  }
  export type ProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | AccountsDefaultArgs<ExtArgs>
  }

  export type $ProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Profile"
    objects: {
      worker: Prisma.$Worker_ProfilePayload<ExtArgs> | null
      accounts: Prisma.$AccountsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      profileID: number
      accountID: number
      firstName: string
      lastName: string
      username: string
      contactNum: string
      profileType: $Enums.profileType | null
    }, ExtArgs["result"]["profile"]>
    composites: {}
  }

  type ProfileGetPayload<S extends boolean | null | undefined | ProfileDefaultArgs> = $Result.GetResult<Prisma.$ProfilePayload, S>

  type ProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProfileCountAggregateInputType | true
    }

  export interface ProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Profile'], meta: { name: 'Profile' } }
    /**
     * Find zero or one Profile that matches the filter.
     * @param {ProfileFindUniqueArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProfileFindUniqueArgs>(args: SelectSubset<T, ProfileFindUniqueArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Profile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProfileFindUniqueOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, ProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Profile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProfileFindFirstArgs>(args?: SelectSubset<T, ProfileFindFirstArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Profile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, ProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Profiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Profiles
     * const profiles = await prisma.profile.findMany()
     * 
     * // Get first 10 Profiles
     * const profiles = await prisma.profile.findMany({ take: 10 })
     * 
     * // Only select the `profileID`
     * const profileWithProfileIDOnly = await prisma.profile.findMany({ select: { profileID: true } })
     * 
     */
    findMany<T extends ProfileFindManyArgs>(args?: SelectSubset<T, ProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Profile.
     * @param {ProfileCreateArgs} args - Arguments to create a Profile.
     * @example
     * // Create one Profile
     * const Profile = await prisma.profile.create({
     *   data: {
     *     // ... data to create a Profile
     *   }
     * })
     * 
     */
    create<T extends ProfileCreateArgs>(args: SelectSubset<T, ProfileCreateArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Profiles.
     * @param {ProfileCreateManyArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProfileCreateManyArgs>(args?: SelectSubset<T, ProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Profiles and returns the data saved in the database.
     * @param {ProfileCreateManyAndReturnArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Profiles and only return the `profileID`
     * const profileWithProfileIDOnly = await prisma.profile.createManyAndReturn({
     *   select: { profileID: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, ProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Profile.
     * @param {ProfileDeleteArgs} args - Arguments to delete one Profile.
     * @example
     * // Delete one Profile
     * const Profile = await prisma.profile.delete({
     *   where: {
     *     // ... filter to delete one Profile
     *   }
     * })
     * 
     */
    delete<T extends ProfileDeleteArgs>(args: SelectSubset<T, ProfileDeleteArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Profile.
     * @param {ProfileUpdateArgs} args - Arguments to update one Profile.
     * @example
     * // Update one Profile
     * const profile = await prisma.profile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProfileUpdateArgs>(args: SelectSubset<T, ProfileUpdateArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Profiles.
     * @param {ProfileDeleteManyArgs} args - Arguments to filter Profiles to delete.
     * @example
     * // Delete a few Profiles
     * const { count } = await prisma.profile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProfileDeleteManyArgs>(args?: SelectSubset<T, ProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProfileUpdateManyArgs>(args: SelectSubset<T, ProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Profiles and returns the data updated in the database.
     * @param {ProfileUpdateManyAndReturnArgs} args - Arguments to update many Profiles.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Profiles and only return the `profileID`
     * const profileWithProfileIDOnly = await prisma.profile.updateManyAndReturn({
     *   select: { profileID: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, ProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Profile.
     * @param {ProfileUpsertArgs} args - Arguments to update or create a Profile.
     * @example
     * // Update or create a Profile
     * const profile = await prisma.profile.upsert({
     *   create: {
     *     // ... data to create a Profile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Profile we want to update
     *   }
     * })
     */
    upsert<T extends ProfileUpsertArgs>(args: SelectSubset<T, ProfileUpsertArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileCountArgs} args - Arguments to filter Profiles to count.
     * @example
     * // Count the number of Profiles
     * const count = await prisma.profile.count({
     *   where: {
     *     // ... the filter for the Profiles we want to count
     *   }
     * })
    **/
    count<T extends ProfileCountArgs>(
      args?: Subset<T, ProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProfileAggregateArgs>(args: Subset<T, ProfileAggregateArgs>): Prisma.PrismaPromise<GetProfileAggregateType<T>>

    /**
     * Group by Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProfileGroupByArgs['orderBy'] }
        : { orderBy?: ProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Profile model
   */
  readonly fields: ProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Profile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    worker<T extends Profile$workerArgs<ExtArgs> = {}>(args?: Subset<T, Profile$workerArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    accounts<T extends AccountsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AccountsDefaultArgs<ExtArgs>>): Prisma__AccountsClient<$Result.GetResult<Prisma.$AccountsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Profile model
   */
  interface ProfileFieldRefs {
    readonly profileID: FieldRef<"Profile", 'Int'>
    readonly accountID: FieldRef<"Profile", 'Int'>
    readonly firstName: FieldRef<"Profile", 'String'>
    readonly lastName: FieldRef<"Profile", 'String'>
    readonly username: FieldRef<"Profile", 'String'>
    readonly contactNum: FieldRef<"Profile", 'String'>
    readonly profileType: FieldRef<"Profile", 'profileType'>
  }
    

  // Custom InputTypes
  /**
   * Profile findUnique
   */
  export type ProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile findUniqueOrThrow
   */
  export type ProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile findFirst
   */
  export type ProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
  }

  /**
   * Profile findFirstOrThrow
   */
  export type ProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
  }

  /**
   * Profile findMany
   */
  export type ProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profiles to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
  }

  /**
   * Profile create
   */
  export type ProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a Profile.
     */
    data: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>
  }

  /**
   * Profile createMany
   */
  export type ProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Profile createManyAndReturn
   */
  export type ProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Profile update
   */
  export type ProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a Profile.
     */
    data: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>
    /**
     * Choose, which Profile to update.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile updateMany
   */
  export type ProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to update.
     */
    limit?: number
  }

  /**
   * Profile updateManyAndReturn
   */
  export type ProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Profile upsert
   */
  export type ProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the Profile to update in case it exists.
     */
    where: ProfileWhereUniqueInput
    /**
     * In case the Profile found by the `where` argument doesn't exist, create a new Profile with this data.
     */
    create: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>
    /**
     * In case the Profile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>
  }

  /**
   * Profile delete
   */
  export type ProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter which Profile to delete.
     */
    where: ProfileWhereUniqueInput
  }

  /**
   * Profile deleteMany
   */
  export type ProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Profiles to delete
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to delete.
     */
    limit?: number
  }

  /**
   * Profile.worker
   */
  export type Profile$workerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    where?: Worker_ProfileWhereInput
  }

  /**
   * Profile without action
   */
  export type ProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
  }


  /**
   * Model Worker_Profile
   */

  export type AggregateWorker_Profile = {
    _count: Worker_ProfileCountAggregateOutputType | null
    _avg: Worker_ProfileAvgAggregateOutputType | null
    _sum: Worker_ProfileSumAggregateOutputType | null
    _min: Worker_ProfileMinAggregateOutputType | null
    _max: Worker_ProfileMaxAggregateOutputType | null
  }

  export type Worker_ProfileAvgAggregateOutputType = {
    profileID: number | null
    hourlyRate: Decimal | null
    responseTimeAvg: Decimal | null
    completionRate: Decimal | null
    totalEarningGross: Decimal | null
    withholdingBalance: Decimal | null
  }

  export type Worker_ProfileSumAggregateOutputType = {
    profileID: number | null
    hourlyRate: Decimal | null
    responseTimeAvg: Decimal | null
    completionRate: Decimal | null
    totalEarningGross: Decimal | null
    withholdingBalance: Decimal | null
  }

  export type Worker_ProfileMinAggregateOutputType = {
    profileID: number | null
    profileImg: string | null
    hourlyRate: Decimal | null
    responseTimeAvg: Decimal | null
    completionRate: Decimal | null
    bio: string | null
    totalEarningGross: Decimal | null
    withholdingBalance: Decimal | null
    description: string | null
    availabilityStatus: $Enums.availabilityStatus | null
  }

  export type Worker_ProfileMaxAggregateOutputType = {
    profileID: number | null
    profileImg: string | null
    hourlyRate: Decimal | null
    responseTimeAvg: Decimal | null
    completionRate: Decimal | null
    bio: string | null
    totalEarningGross: Decimal | null
    withholdingBalance: Decimal | null
    description: string | null
    availabilityStatus: $Enums.availabilityStatus | null
  }

  export type Worker_ProfileCountAggregateOutputType = {
    profileID: number
    profileImg: number
    hourlyRate: number
    verifiedSkills: number
    responseTimeAvg: number
    completionRate: number
    bio: number
    totalEarningGross: number
    withholdingBalance: number
    description: number
    availabilityStatus: number
    _all: number
  }


  export type Worker_ProfileAvgAggregateInputType = {
    profileID?: true
    hourlyRate?: true
    responseTimeAvg?: true
    completionRate?: true
    totalEarningGross?: true
    withholdingBalance?: true
  }

  export type Worker_ProfileSumAggregateInputType = {
    profileID?: true
    hourlyRate?: true
    responseTimeAvg?: true
    completionRate?: true
    totalEarningGross?: true
    withholdingBalance?: true
  }

  export type Worker_ProfileMinAggregateInputType = {
    profileID?: true
    profileImg?: true
    hourlyRate?: true
    responseTimeAvg?: true
    completionRate?: true
    bio?: true
    totalEarningGross?: true
    withholdingBalance?: true
    description?: true
    availabilityStatus?: true
  }

  export type Worker_ProfileMaxAggregateInputType = {
    profileID?: true
    profileImg?: true
    hourlyRate?: true
    responseTimeAvg?: true
    completionRate?: true
    bio?: true
    totalEarningGross?: true
    withholdingBalance?: true
    description?: true
    availabilityStatus?: true
  }

  export type Worker_ProfileCountAggregateInputType = {
    profileID?: true
    profileImg?: true
    hourlyRate?: true
    verifiedSkills?: true
    responseTimeAvg?: true
    completionRate?: true
    bio?: true
    totalEarningGross?: true
    withholdingBalance?: true
    description?: true
    availabilityStatus?: true
    _all?: true
  }

  export type Worker_ProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Worker_Profile to aggregate.
     */
    where?: Worker_ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Worker_Profiles to fetch.
     */
    orderBy?: Worker_ProfileOrderByWithRelationInput | Worker_ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: Worker_ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Worker_Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Worker_Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Worker_Profiles
    **/
    _count?: true | Worker_ProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Worker_ProfileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Worker_ProfileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Worker_ProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Worker_ProfileMaxAggregateInputType
  }

  export type GetWorker_ProfileAggregateType<T extends Worker_ProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateWorker_Profile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorker_Profile[P]>
      : GetScalarType<T[P], AggregateWorker_Profile[P]>
  }




  export type Worker_ProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Worker_ProfileWhereInput
    orderBy?: Worker_ProfileOrderByWithAggregationInput | Worker_ProfileOrderByWithAggregationInput[]
    by: Worker_ProfileScalarFieldEnum[] | Worker_ProfileScalarFieldEnum
    having?: Worker_ProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Worker_ProfileCountAggregateInputType | true
    _avg?: Worker_ProfileAvgAggregateInputType
    _sum?: Worker_ProfileSumAggregateInputType
    _min?: Worker_ProfileMinAggregateInputType
    _max?: Worker_ProfileMaxAggregateInputType
  }

  export type Worker_ProfileGroupByOutputType = {
    profileID: number
    profileImg: string | null
    hourlyRate: Decimal
    verifiedSkills: JsonValue
    responseTimeAvg: Decimal
    completionRate: Decimal
    bio: string
    totalEarningGross: Decimal
    withholdingBalance: Decimal
    description: string
    availabilityStatus: $Enums.availabilityStatus
    _count: Worker_ProfileCountAggregateOutputType | null
    _avg: Worker_ProfileAvgAggregateOutputType | null
    _sum: Worker_ProfileSumAggregateOutputType | null
    _min: Worker_ProfileMinAggregateOutputType | null
    _max: Worker_ProfileMaxAggregateOutputType | null
  }

  type GetWorker_ProfileGroupByPayload<T extends Worker_ProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Worker_ProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Worker_ProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Worker_ProfileGroupByOutputType[P]>
            : GetScalarType<T[P], Worker_ProfileGroupByOutputType[P]>
        }
      >
    >


  export type Worker_ProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    profileID?: boolean
    profileImg?: boolean
    hourlyRate?: boolean
    verifiedSkills?: boolean
    responseTimeAvg?: boolean
    completionRate?: boolean
    bio?: boolean
    totalEarningGross?: boolean
    withholdingBalance?: boolean
    description?: boolean
    availabilityStatus?: boolean
    profile?: boolean | Worker_Profile$profileArgs<ExtArgs>
    freelancer_specialization?: boolean | Worker_Profile$freelancer_specializationArgs<ExtArgs>
    _count?: boolean | Worker_ProfileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["worker_Profile"]>

  export type Worker_ProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    profileID?: boolean
    profileImg?: boolean
    hourlyRate?: boolean
    verifiedSkills?: boolean
    responseTimeAvg?: boolean
    completionRate?: boolean
    bio?: boolean
    totalEarningGross?: boolean
    withholdingBalance?: boolean
    description?: boolean
    availabilityStatus?: boolean
    profile?: boolean | Worker_Profile$profileArgs<ExtArgs>
  }, ExtArgs["result"]["worker_Profile"]>

  export type Worker_ProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    profileID?: boolean
    profileImg?: boolean
    hourlyRate?: boolean
    verifiedSkills?: boolean
    responseTimeAvg?: boolean
    completionRate?: boolean
    bio?: boolean
    totalEarningGross?: boolean
    withholdingBalance?: boolean
    description?: boolean
    availabilityStatus?: boolean
    profile?: boolean | Worker_Profile$profileArgs<ExtArgs>
  }, ExtArgs["result"]["worker_Profile"]>

  export type Worker_ProfileSelectScalar = {
    profileID?: boolean
    profileImg?: boolean
    hourlyRate?: boolean
    verifiedSkills?: boolean
    responseTimeAvg?: boolean
    completionRate?: boolean
    bio?: boolean
    totalEarningGross?: boolean
    withholdingBalance?: boolean
    description?: boolean
    availabilityStatus?: boolean
  }

  export type Worker_ProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"profileID" | "profileImg" | "hourlyRate" | "verifiedSkills" | "responseTimeAvg" | "completionRate" | "bio" | "totalEarningGross" | "withholdingBalance" | "description" | "availabilityStatus", ExtArgs["result"]["worker_Profile"]>
  export type Worker_ProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | Worker_Profile$profileArgs<ExtArgs>
    freelancer_specialization?: boolean | Worker_Profile$freelancer_specializationArgs<ExtArgs>
    _count?: boolean | Worker_ProfileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type Worker_ProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | Worker_Profile$profileArgs<ExtArgs>
  }
  export type Worker_ProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | Worker_Profile$profileArgs<ExtArgs>
  }

  export type $Worker_ProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Worker_Profile"
    objects: {
      profile: Prisma.$ProfilePayload<ExtArgs> | null
      freelancer_specialization: Prisma.$Freelancer_SpecializationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      profileID: number
      profileImg: string | null
      hourlyRate: Prisma.Decimal
      verifiedSkills: Prisma.JsonValue
      responseTimeAvg: Prisma.Decimal
      completionRate: Prisma.Decimal
      bio: string
      totalEarningGross: Prisma.Decimal
      withholdingBalance: Prisma.Decimal
      description: string
      availabilityStatus: $Enums.availabilityStatus
    }, ExtArgs["result"]["worker_Profile"]>
    composites: {}
  }

  type Worker_ProfileGetPayload<S extends boolean | null | undefined | Worker_ProfileDefaultArgs> = $Result.GetResult<Prisma.$Worker_ProfilePayload, S>

  type Worker_ProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<Worker_ProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Worker_ProfileCountAggregateInputType | true
    }

  export interface Worker_ProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Worker_Profile'], meta: { name: 'Worker_Profile' } }
    /**
     * Find zero or one Worker_Profile that matches the filter.
     * @param {Worker_ProfileFindUniqueArgs} args - Arguments to find a Worker_Profile
     * @example
     * // Get one Worker_Profile
     * const worker_Profile = await prisma.worker_Profile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends Worker_ProfileFindUniqueArgs>(args: SelectSubset<T, Worker_ProfileFindUniqueArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Worker_Profile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {Worker_ProfileFindUniqueOrThrowArgs} args - Arguments to find a Worker_Profile
     * @example
     * // Get one Worker_Profile
     * const worker_Profile = await prisma.worker_Profile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends Worker_ProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, Worker_ProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Worker_Profile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Worker_ProfileFindFirstArgs} args - Arguments to find a Worker_Profile
     * @example
     * // Get one Worker_Profile
     * const worker_Profile = await prisma.worker_Profile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends Worker_ProfileFindFirstArgs>(args?: SelectSubset<T, Worker_ProfileFindFirstArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Worker_Profile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Worker_ProfileFindFirstOrThrowArgs} args - Arguments to find a Worker_Profile
     * @example
     * // Get one Worker_Profile
     * const worker_Profile = await prisma.worker_Profile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends Worker_ProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, Worker_ProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Worker_Profiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Worker_ProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Worker_Profiles
     * const worker_Profiles = await prisma.worker_Profile.findMany()
     * 
     * // Get first 10 Worker_Profiles
     * const worker_Profiles = await prisma.worker_Profile.findMany({ take: 10 })
     * 
     * // Only select the `profileID`
     * const worker_ProfileWithProfileIDOnly = await prisma.worker_Profile.findMany({ select: { profileID: true } })
     * 
     */
    findMany<T extends Worker_ProfileFindManyArgs>(args?: SelectSubset<T, Worker_ProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Worker_Profile.
     * @param {Worker_ProfileCreateArgs} args - Arguments to create a Worker_Profile.
     * @example
     * // Create one Worker_Profile
     * const Worker_Profile = await prisma.worker_Profile.create({
     *   data: {
     *     // ... data to create a Worker_Profile
     *   }
     * })
     * 
     */
    create<T extends Worker_ProfileCreateArgs>(args: SelectSubset<T, Worker_ProfileCreateArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Worker_Profiles.
     * @param {Worker_ProfileCreateManyArgs} args - Arguments to create many Worker_Profiles.
     * @example
     * // Create many Worker_Profiles
     * const worker_Profile = await prisma.worker_Profile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends Worker_ProfileCreateManyArgs>(args?: SelectSubset<T, Worker_ProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Worker_Profiles and returns the data saved in the database.
     * @param {Worker_ProfileCreateManyAndReturnArgs} args - Arguments to create many Worker_Profiles.
     * @example
     * // Create many Worker_Profiles
     * const worker_Profile = await prisma.worker_Profile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Worker_Profiles and only return the `profileID`
     * const worker_ProfileWithProfileIDOnly = await prisma.worker_Profile.createManyAndReturn({
     *   select: { profileID: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends Worker_ProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, Worker_ProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Worker_Profile.
     * @param {Worker_ProfileDeleteArgs} args - Arguments to delete one Worker_Profile.
     * @example
     * // Delete one Worker_Profile
     * const Worker_Profile = await prisma.worker_Profile.delete({
     *   where: {
     *     // ... filter to delete one Worker_Profile
     *   }
     * })
     * 
     */
    delete<T extends Worker_ProfileDeleteArgs>(args: SelectSubset<T, Worker_ProfileDeleteArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Worker_Profile.
     * @param {Worker_ProfileUpdateArgs} args - Arguments to update one Worker_Profile.
     * @example
     * // Update one Worker_Profile
     * const worker_Profile = await prisma.worker_Profile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends Worker_ProfileUpdateArgs>(args: SelectSubset<T, Worker_ProfileUpdateArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Worker_Profiles.
     * @param {Worker_ProfileDeleteManyArgs} args - Arguments to filter Worker_Profiles to delete.
     * @example
     * // Delete a few Worker_Profiles
     * const { count } = await prisma.worker_Profile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends Worker_ProfileDeleteManyArgs>(args?: SelectSubset<T, Worker_ProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Worker_Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Worker_ProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Worker_Profiles
     * const worker_Profile = await prisma.worker_Profile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends Worker_ProfileUpdateManyArgs>(args: SelectSubset<T, Worker_ProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Worker_Profiles and returns the data updated in the database.
     * @param {Worker_ProfileUpdateManyAndReturnArgs} args - Arguments to update many Worker_Profiles.
     * @example
     * // Update many Worker_Profiles
     * const worker_Profile = await prisma.worker_Profile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Worker_Profiles and only return the `profileID`
     * const worker_ProfileWithProfileIDOnly = await prisma.worker_Profile.updateManyAndReturn({
     *   select: { profileID: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends Worker_ProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, Worker_ProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Worker_Profile.
     * @param {Worker_ProfileUpsertArgs} args - Arguments to update or create a Worker_Profile.
     * @example
     * // Update or create a Worker_Profile
     * const worker_Profile = await prisma.worker_Profile.upsert({
     *   create: {
     *     // ... data to create a Worker_Profile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Worker_Profile we want to update
     *   }
     * })
     */
    upsert<T extends Worker_ProfileUpsertArgs>(args: SelectSubset<T, Worker_ProfileUpsertArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Worker_Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Worker_ProfileCountArgs} args - Arguments to filter Worker_Profiles to count.
     * @example
     * // Count the number of Worker_Profiles
     * const count = await prisma.worker_Profile.count({
     *   where: {
     *     // ... the filter for the Worker_Profiles we want to count
     *   }
     * })
    **/
    count<T extends Worker_ProfileCountArgs>(
      args?: Subset<T, Worker_ProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Worker_ProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Worker_Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Worker_ProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Worker_ProfileAggregateArgs>(args: Subset<T, Worker_ProfileAggregateArgs>): Prisma.PrismaPromise<GetWorker_ProfileAggregateType<T>>

    /**
     * Group by Worker_Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Worker_ProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends Worker_ProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: Worker_ProfileGroupByArgs['orderBy'] }
        : { orderBy?: Worker_ProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, Worker_ProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorker_ProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Worker_Profile model
   */
  readonly fields: Worker_ProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Worker_Profile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__Worker_ProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    profile<T extends Worker_Profile$profileArgs<ExtArgs> = {}>(args?: Subset<T, Worker_Profile$profileArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    freelancer_specialization<T extends Worker_Profile$freelancer_specializationArgs<ExtArgs> = {}>(args?: Subset<T, Worker_Profile$freelancer_specializationArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Worker_Profile model
   */
  interface Worker_ProfileFieldRefs {
    readonly profileID: FieldRef<"Worker_Profile", 'Int'>
    readonly profileImg: FieldRef<"Worker_Profile", 'String'>
    readonly hourlyRate: FieldRef<"Worker_Profile", 'Decimal'>
    readonly verifiedSkills: FieldRef<"Worker_Profile", 'Json'>
    readonly responseTimeAvg: FieldRef<"Worker_Profile", 'Decimal'>
    readonly completionRate: FieldRef<"Worker_Profile", 'Decimal'>
    readonly bio: FieldRef<"Worker_Profile", 'String'>
    readonly totalEarningGross: FieldRef<"Worker_Profile", 'Decimal'>
    readonly withholdingBalance: FieldRef<"Worker_Profile", 'Decimal'>
    readonly description: FieldRef<"Worker_Profile", 'String'>
    readonly availabilityStatus: FieldRef<"Worker_Profile", 'availabilityStatus'>
  }
    

  // Custom InputTypes
  /**
   * Worker_Profile findUnique
   */
  export type Worker_ProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Worker_Profile to fetch.
     */
    where: Worker_ProfileWhereUniqueInput
  }

  /**
   * Worker_Profile findUniqueOrThrow
   */
  export type Worker_ProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Worker_Profile to fetch.
     */
    where: Worker_ProfileWhereUniqueInput
  }

  /**
   * Worker_Profile findFirst
   */
  export type Worker_ProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Worker_Profile to fetch.
     */
    where?: Worker_ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Worker_Profiles to fetch.
     */
    orderBy?: Worker_ProfileOrderByWithRelationInput | Worker_ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Worker_Profiles.
     */
    cursor?: Worker_ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Worker_Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Worker_Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Worker_Profiles.
     */
    distinct?: Worker_ProfileScalarFieldEnum | Worker_ProfileScalarFieldEnum[]
  }

  /**
   * Worker_Profile findFirstOrThrow
   */
  export type Worker_ProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Worker_Profile to fetch.
     */
    where?: Worker_ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Worker_Profiles to fetch.
     */
    orderBy?: Worker_ProfileOrderByWithRelationInput | Worker_ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Worker_Profiles.
     */
    cursor?: Worker_ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Worker_Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Worker_Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Worker_Profiles.
     */
    distinct?: Worker_ProfileScalarFieldEnum | Worker_ProfileScalarFieldEnum[]
  }

  /**
   * Worker_Profile findMany
   */
  export type Worker_ProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Worker_Profiles to fetch.
     */
    where?: Worker_ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Worker_Profiles to fetch.
     */
    orderBy?: Worker_ProfileOrderByWithRelationInput | Worker_ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Worker_Profiles.
     */
    cursor?: Worker_ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Worker_Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Worker_Profiles.
     */
    skip?: number
    distinct?: Worker_ProfileScalarFieldEnum | Worker_ProfileScalarFieldEnum[]
  }

  /**
   * Worker_Profile create
   */
  export type Worker_ProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a Worker_Profile.
     */
    data: XOR<Worker_ProfileCreateInput, Worker_ProfileUncheckedCreateInput>
  }

  /**
   * Worker_Profile createMany
   */
  export type Worker_ProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Worker_Profiles.
     */
    data: Worker_ProfileCreateManyInput | Worker_ProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Worker_Profile createManyAndReturn
   */
  export type Worker_ProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * The data used to create many Worker_Profiles.
     */
    data: Worker_ProfileCreateManyInput | Worker_ProfileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Worker_Profile update
   */
  export type Worker_ProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a Worker_Profile.
     */
    data: XOR<Worker_ProfileUpdateInput, Worker_ProfileUncheckedUpdateInput>
    /**
     * Choose, which Worker_Profile to update.
     */
    where: Worker_ProfileWhereUniqueInput
  }

  /**
   * Worker_Profile updateMany
   */
  export type Worker_ProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Worker_Profiles.
     */
    data: XOR<Worker_ProfileUpdateManyMutationInput, Worker_ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Worker_Profiles to update
     */
    where?: Worker_ProfileWhereInput
    /**
     * Limit how many Worker_Profiles to update.
     */
    limit?: number
  }

  /**
   * Worker_Profile updateManyAndReturn
   */
  export type Worker_ProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * The data used to update Worker_Profiles.
     */
    data: XOR<Worker_ProfileUpdateManyMutationInput, Worker_ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Worker_Profiles to update
     */
    where?: Worker_ProfileWhereInput
    /**
     * Limit how many Worker_Profiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Worker_Profile upsert
   */
  export type Worker_ProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the Worker_Profile to update in case it exists.
     */
    where: Worker_ProfileWhereUniqueInput
    /**
     * In case the Worker_Profile found by the `where` argument doesn't exist, create a new Worker_Profile with this data.
     */
    create: XOR<Worker_ProfileCreateInput, Worker_ProfileUncheckedCreateInput>
    /**
     * In case the Worker_Profile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<Worker_ProfileUpdateInput, Worker_ProfileUncheckedUpdateInput>
  }

  /**
   * Worker_Profile delete
   */
  export type Worker_ProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
    /**
     * Filter which Worker_Profile to delete.
     */
    where: Worker_ProfileWhereUniqueInput
  }

  /**
   * Worker_Profile deleteMany
   */
  export type Worker_ProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Worker_Profiles to delete
     */
    where?: Worker_ProfileWhereInput
    /**
     * Limit how many Worker_Profiles to delete.
     */
    limit?: number
  }

  /**
   * Worker_Profile.profile
   */
  export type Worker_Profile$profileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    where?: ProfileWhereInput
  }

  /**
   * Worker_Profile.freelancer_specialization
   */
  export type Worker_Profile$freelancer_specializationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    where?: Freelancer_SpecializationWhereInput
    orderBy?: Freelancer_SpecializationOrderByWithRelationInput | Freelancer_SpecializationOrderByWithRelationInput[]
    cursor?: Freelancer_SpecializationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Freelancer_SpecializationScalarFieldEnum | Freelancer_SpecializationScalarFieldEnum[]
  }

  /**
   * Worker_Profile without action
   */
  export type Worker_ProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Worker_Profile
     */
    select?: Worker_ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Worker_Profile
     */
    omit?: Worker_ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Worker_ProfileInclude<ExtArgs> | null
  }


  /**
   * Model Freelancer_Specialization
   */

  export type AggregateFreelancer_Specialization = {
    _count: Freelancer_SpecializationCountAggregateOutputType | null
    _avg: Freelancer_SpecializationAvgAggregateOutputType | null
    _sum: Freelancer_SpecializationSumAggregateOutputType | null
    _min: Freelancer_SpecializationMinAggregateOutputType | null
    _max: Freelancer_SpecializationMaxAggregateOutputType | null
  }

  export type Freelancer_SpecializationAvgAggregateOutputType = {
    workerID: number | null
    specializationID: number | null
    experienceYears: number | null
  }

  export type Freelancer_SpecializationSumAggregateOutputType = {
    workerID: number | null
    specializationID: number | null
    experienceYears: number | null
  }

  export type Freelancer_SpecializationMinAggregateOutputType = {
    workerID: number | null
    specializationID: number | null
    experienceYears: number | null
    certification: string | null
  }

  export type Freelancer_SpecializationMaxAggregateOutputType = {
    workerID: number | null
    specializationID: number | null
    experienceYears: number | null
    certification: string | null
  }

  export type Freelancer_SpecializationCountAggregateOutputType = {
    workerID: number
    specializationID: number
    experienceYears: number
    certification: number
    _all: number
  }


  export type Freelancer_SpecializationAvgAggregateInputType = {
    workerID?: true
    specializationID?: true
    experienceYears?: true
  }

  export type Freelancer_SpecializationSumAggregateInputType = {
    workerID?: true
    specializationID?: true
    experienceYears?: true
  }

  export type Freelancer_SpecializationMinAggregateInputType = {
    workerID?: true
    specializationID?: true
    experienceYears?: true
    certification?: true
  }

  export type Freelancer_SpecializationMaxAggregateInputType = {
    workerID?: true
    specializationID?: true
    experienceYears?: true
    certification?: true
  }

  export type Freelancer_SpecializationCountAggregateInputType = {
    workerID?: true
    specializationID?: true
    experienceYears?: true
    certification?: true
    _all?: true
  }

  export type Freelancer_SpecializationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Freelancer_Specialization to aggregate.
     */
    where?: Freelancer_SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Freelancer_Specializations to fetch.
     */
    orderBy?: Freelancer_SpecializationOrderByWithRelationInput | Freelancer_SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: Freelancer_SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Freelancer_Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Freelancer_Specializations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Freelancer_Specializations
    **/
    _count?: true | Freelancer_SpecializationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Freelancer_SpecializationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Freelancer_SpecializationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Freelancer_SpecializationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Freelancer_SpecializationMaxAggregateInputType
  }

  export type GetFreelancer_SpecializationAggregateType<T extends Freelancer_SpecializationAggregateArgs> = {
        [P in keyof T & keyof AggregateFreelancer_Specialization]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFreelancer_Specialization[P]>
      : GetScalarType<T[P], AggregateFreelancer_Specialization[P]>
  }




  export type Freelancer_SpecializationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Freelancer_SpecializationWhereInput
    orderBy?: Freelancer_SpecializationOrderByWithAggregationInput | Freelancer_SpecializationOrderByWithAggregationInput[]
    by: Freelancer_SpecializationScalarFieldEnum[] | Freelancer_SpecializationScalarFieldEnum
    having?: Freelancer_SpecializationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Freelancer_SpecializationCountAggregateInputType | true
    _avg?: Freelancer_SpecializationAvgAggregateInputType
    _sum?: Freelancer_SpecializationSumAggregateInputType
    _min?: Freelancer_SpecializationMinAggregateInputType
    _max?: Freelancer_SpecializationMaxAggregateInputType
  }

  export type Freelancer_SpecializationGroupByOutputType = {
    workerID: number
    specializationID: number
    experienceYears: number
    certification: string
    _count: Freelancer_SpecializationCountAggregateOutputType | null
    _avg: Freelancer_SpecializationAvgAggregateOutputType | null
    _sum: Freelancer_SpecializationSumAggregateOutputType | null
    _min: Freelancer_SpecializationMinAggregateOutputType | null
    _max: Freelancer_SpecializationMaxAggregateOutputType | null
  }

  type GetFreelancer_SpecializationGroupByPayload<T extends Freelancer_SpecializationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Freelancer_SpecializationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Freelancer_SpecializationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Freelancer_SpecializationGroupByOutputType[P]>
            : GetScalarType<T[P], Freelancer_SpecializationGroupByOutputType[P]>
        }
      >
    >


  export type Freelancer_SpecializationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    workerID?: boolean
    specializationID?: boolean
    experienceYears?: boolean
    certification?: boolean
    worker_profile?: boolean | Worker_ProfileDefaultArgs<ExtArgs>
    specialization?: boolean | SpecializationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["freelancer_Specialization"]>

  export type Freelancer_SpecializationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    workerID?: boolean
    specializationID?: boolean
    experienceYears?: boolean
    certification?: boolean
    worker_profile?: boolean | Worker_ProfileDefaultArgs<ExtArgs>
    specialization?: boolean | SpecializationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["freelancer_Specialization"]>

  export type Freelancer_SpecializationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    workerID?: boolean
    specializationID?: boolean
    experienceYears?: boolean
    certification?: boolean
    worker_profile?: boolean | Worker_ProfileDefaultArgs<ExtArgs>
    specialization?: boolean | SpecializationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["freelancer_Specialization"]>

  export type Freelancer_SpecializationSelectScalar = {
    workerID?: boolean
    specializationID?: boolean
    experienceYears?: boolean
    certification?: boolean
  }

  export type Freelancer_SpecializationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"workerID" | "specializationID" | "experienceYears" | "certification", ExtArgs["result"]["freelancer_Specialization"]>
  export type Freelancer_SpecializationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    worker_profile?: boolean | Worker_ProfileDefaultArgs<ExtArgs>
    specialization?: boolean | SpecializationDefaultArgs<ExtArgs>
  }
  export type Freelancer_SpecializationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    worker_profile?: boolean | Worker_ProfileDefaultArgs<ExtArgs>
    specialization?: boolean | SpecializationDefaultArgs<ExtArgs>
  }
  export type Freelancer_SpecializationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    worker_profile?: boolean | Worker_ProfileDefaultArgs<ExtArgs>
    specialization?: boolean | SpecializationDefaultArgs<ExtArgs>
  }

  export type $Freelancer_SpecializationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Freelancer_Specialization"
    objects: {
      worker_profile: Prisma.$Worker_ProfilePayload<ExtArgs>
      specialization: Prisma.$SpecializationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      workerID: number
      specializationID: number
      experienceYears: number
      certification: string
    }, ExtArgs["result"]["freelancer_Specialization"]>
    composites: {}
  }

  type Freelancer_SpecializationGetPayload<S extends boolean | null | undefined | Freelancer_SpecializationDefaultArgs> = $Result.GetResult<Prisma.$Freelancer_SpecializationPayload, S>

  type Freelancer_SpecializationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<Freelancer_SpecializationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Freelancer_SpecializationCountAggregateInputType | true
    }

  export interface Freelancer_SpecializationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Freelancer_Specialization'], meta: { name: 'Freelancer_Specialization' } }
    /**
     * Find zero or one Freelancer_Specialization that matches the filter.
     * @param {Freelancer_SpecializationFindUniqueArgs} args - Arguments to find a Freelancer_Specialization
     * @example
     * // Get one Freelancer_Specialization
     * const freelancer_Specialization = await prisma.freelancer_Specialization.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends Freelancer_SpecializationFindUniqueArgs>(args: SelectSubset<T, Freelancer_SpecializationFindUniqueArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Freelancer_Specialization that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {Freelancer_SpecializationFindUniqueOrThrowArgs} args - Arguments to find a Freelancer_Specialization
     * @example
     * // Get one Freelancer_Specialization
     * const freelancer_Specialization = await prisma.freelancer_Specialization.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends Freelancer_SpecializationFindUniqueOrThrowArgs>(args: SelectSubset<T, Freelancer_SpecializationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Freelancer_Specialization that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Freelancer_SpecializationFindFirstArgs} args - Arguments to find a Freelancer_Specialization
     * @example
     * // Get one Freelancer_Specialization
     * const freelancer_Specialization = await prisma.freelancer_Specialization.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends Freelancer_SpecializationFindFirstArgs>(args?: SelectSubset<T, Freelancer_SpecializationFindFirstArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Freelancer_Specialization that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Freelancer_SpecializationFindFirstOrThrowArgs} args - Arguments to find a Freelancer_Specialization
     * @example
     * // Get one Freelancer_Specialization
     * const freelancer_Specialization = await prisma.freelancer_Specialization.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends Freelancer_SpecializationFindFirstOrThrowArgs>(args?: SelectSubset<T, Freelancer_SpecializationFindFirstOrThrowArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Freelancer_Specializations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Freelancer_SpecializationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Freelancer_Specializations
     * const freelancer_Specializations = await prisma.freelancer_Specialization.findMany()
     * 
     * // Get first 10 Freelancer_Specializations
     * const freelancer_Specializations = await prisma.freelancer_Specialization.findMany({ take: 10 })
     * 
     * // Only select the `workerID`
     * const freelancer_SpecializationWithWorkerIDOnly = await prisma.freelancer_Specialization.findMany({ select: { workerID: true } })
     * 
     */
    findMany<T extends Freelancer_SpecializationFindManyArgs>(args?: SelectSubset<T, Freelancer_SpecializationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Freelancer_Specialization.
     * @param {Freelancer_SpecializationCreateArgs} args - Arguments to create a Freelancer_Specialization.
     * @example
     * // Create one Freelancer_Specialization
     * const Freelancer_Specialization = await prisma.freelancer_Specialization.create({
     *   data: {
     *     // ... data to create a Freelancer_Specialization
     *   }
     * })
     * 
     */
    create<T extends Freelancer_SpecializationCreateArgs>(args: SelectSubset<T, Freelancer_SpecializationCreateArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Freelancer_Specializations.
     * @param {Freelancer_SpecializationCreateManyArgs} args - Arguments to create many Freelancer_Specializations.
     * @example
     * // Create many Freelancer_Specializations
     * const freelancer_Specialization = await prisma.freelancer_Specialization.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends Freelancer_SpecializationCreateManyArgs>(args?: SelectSubset<T, Freelancer_SpecializationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Freelancer_Specializations and returns the data saved in the database.
     * @param {Freelancer_SpecializationCreateManyAndReturnArgs} args - Arguments to create many Freelancer_Specializations.
     * @example
     * // Create many Freelancer_Specializations
     * const freelancer_Specialization = await prisma.freelancer_Specialization.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Freelancer_Specializations and only return the `workerID`
     * const freelancer_SpecializationWithWorkerIDOnly = await prisma.freelancer_Specialization.createManyAndReturn({
     *   select: { workerID: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends Freelancer_SpecializationCreateManyAndReturnArgs>(args?: SelectSubset<T, Freelancer_SpecializationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Freelancer_Specialization.
     * @param {Freelancer_SpecializationDeleteArgs} args - Arguments to delete one Freelancer_Specialization.
     * @example
     * // Delete one Freelancer_Specialization
     * const Freelancer_Specialization = await prisma.freelancer_Specialization.delete({
     *   where: {
     *     // ... filter to delete one Freelancer_Specialization
     *   }
     * })
     * 
     */
    delete<T extends Freelancer_SpecializationDeleteArgs>(args: SelectSubset<T, Freelancer_SpecializationDeleteArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Freelancer_Specialization.
     * @param {Freelancer_SpecializationUpdateArgs} args - Arguments to update one Freelancer_Specialization.
     * @example
     * // Update one Freelancer_Specialization
     * const freelancer_Specialization = await prisma.freelancer_Specialization.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends Freelancer_SpecializationUpdateArgs>(args: SelectSubset<T, Freelancer_SpecializationUpdateArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Freelancer_Specializations.
     * @param {Freelancer_SpecializationDeleteManyArgs} args - Arguments to filter Freelancer_Specializations to delete.
     * @example
     * // Delete a few Freelancer_Specializations
     * const { count } = await prisma.freelancer_Specialization.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends Freelancer_SpecializationDeleteManyArgs>(args?: SelectSubset<T, Freelancer_SpecializationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Freelancer_Specializations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Freelancer_SpecializationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Freelancer_Specializations
     * const freelancer_Specialization = await prisma.freelancer_Specialization.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends Freelancer_SpecializationUpdateManyArgs>(args: SelectSubset<T, Freelancer_SpecializationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Freelancer_Specializations and returns the data updated in the database.
     * @param {Freelancer_SpecializationUpdateManyAndReturnArgs} args - Arguments to update many Freelancer_Specializations.
     * @example
     * // Update many Freelancer_Specializations
     * const freelancer_Specialization = await prisma.freelancer_Specialization.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Freelancer_Specializations and only return the `workerID`
     * const freelancer_SpecializationWithWorkerIDOnly = await prisma.freelancer_Specialization.updateManyAndReturn({
     *   select: { workerID: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends Freelancer_SpecializationUpdateManyAndReturnArgs>(args: SelectSubset<T, Freelancer_SpecializationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Freelancer_Specialization.
     * @param {Freelancer_SpecializationUpsertArgs} args - Arguments to update or create a Freelancer_Specialization.
     * @example
     * // Update or create a Freelancer_Specialization
     * const freelancer_Specialization = await prisma.freelancer_Specialization.upsert({
     *   create: {
     *     // ... data to create a Freelancer_Specialization
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Freelancer_Specialization we want to update
     *   }
     * })
     */
    upsert<T extends Freelancer_SpecializationUpsertArgs>(args: SelectSubset<T, Freelancer_SpecializationUpsertArgs<ExtArgs>>): Prisma__Freelancer_SpecializationClient<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Freelancer_Specializations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Freelancer_SpecializationCountArgs} args - Arguments to filter Freelancer_Specializations to count.
     * @example
     * // Count the number of Freelancer_Specializations
     * const count = await prisma.freelancer_Specialization.count({
     *   where: {
     *     // ... the filter for the Freelancer_Specializations we want to count
     *   }
     * })
    **/
    count<T extends Freelancer_SpecializationCountArgs>(
      args?: Subset<T, Freelancer_SpecializationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Freelancer_SpecializationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Freelancer_Specialization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Freelancer_SpecializationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Freelancer_SpecializationAggregateArgs>(args: Subset<T, Freelancer_SpecializationAggregateArgs>): Prisma.PrismaPromise<GetFreelancer_SpecializationAggregateType<T>>

    /**
     * Group by Freelancer_Specialization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Freelancer_SpecializationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends Freelancer_SpecializationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: Freelancer_SpecializationGroupByArgs['orderBy'] }
        : { orderBy?: Freelancer_SpecializationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, Freelancer_SpecializationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFreelancer_SpecializationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Freelancer_Specialization model
   */
  readonly fields: Freelancer_SpecializationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Freelancer_Specialization.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__Freelancer_SpecializationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    worker_profile<T extends Worker_ProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, Worker_ProfileDefaultArgs<ExtArgs>>): Prisma__Worker_ProfileClient<$Result.GetResult<Prisma.$Worker_ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    specialization<T extends SpecializationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpecializationDefaultArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Freelancer_Specialization model
   */
  interface Freelancer_SpecializationFieldRefs {
    readonly workerID: FieldRef<"Freelancer_Specialization", 'Int'>
    readonly specializationID: FieldRef<"Freelancer_Specialization", 'Int'>
    readonly experienceYears: FieldRef<"Freelancer_Specialization", 'Int'>
    readonly certification: FieldRef<"Freelancer_Specialization", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Freelancer_Specialization findUnique
   */
  export type Freelancer_SpecializationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Freelancer_Specialization to fetch.
     */
    where: Freelancer_SpecializationWhereUniqueInput
  }

  /**
   * Freelancer_Specialization findUniqueOrThrow
   */
  export type Freelancer_SpecializationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Freelancer_Specialization to fetch.
     */
    where: Freelancer_SpecializationWhereUniqueInput
  }

  /**
   * Freelancer_Specialization findFirst
   */
  export type Freelancer_SpecializationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Freelancer_Specialization to fetch.
     */
    where?: Freelancer_SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Freelancer_Specializations to fetch.
     */
    orderBy?: Freelancer_SpecializationOrderByWithRelationInput | Freelancer_SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Freelancer_Specializations.
     */
    cursor?: Freelancer_SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Freelancer_Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Freelancer_Specializations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Freelancer_Specializations.
     */
    distinct?: Freelancer_SpecializationScalarFieldEnum | Freelancer_SpecializationScalarFieldEnum[]
  }

  /**
   * Freelancer_Specialization findFirstOrThrow
   */
  export type Freelancer_SpecializationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Freelancer_Specialization to fetch.
     */
    where?: Freelancer_SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Freelancer_Specializations to fetch.
     */
    orderBy?: Freelancer_SpecializationOrderByWithRelationInput | Freelancer_SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Freelancer_Specializations.
     */
    cursor?: Freelancer_SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Freelancer_Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Freelancer_Specializations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Freelancer_Specializations.
     */
    distinct?: Freelancer_SpecializationScalarFieldEnum | Freelancer_SpecializationScalarFieldEnum[]
  }

  /**
   * Freelancer_Specialization findMany
   */
  export type Freelancer_SpecializationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Freelancer_Specializations to fetch.
     */
    where?: Freelancer_SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Freelancer_Specializations to fetch.
     */
    orderBy?: Freelancer_SpecializationOrderByWithRelationInput | Freelancer_SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Freelancer_Specializations.
     */
    cursor?: Freelancer_SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Freelancer_Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Freelancer_Specializations.
     */
    skip?: number
    distinct?: Freelancer_SpecializationScalarFieldEnum | Freelancer_SpecializationScalarFieldEnum[]
  }

  /**
   * Freelancer_Specialization create
   */
  export type Freelancer_SpecializationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * The data needed to create a Freelancer_Specialization.
     */
    data: XOR<Freelancer_SpecializationCreateInput, Freelancer_SpecializationUncheckedCreateInput>
  }

  /**
   * Freelancer_Specialization createMany
   */
  export type Freelancer_SpecializationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Freelancer_Specializations.
     */
    data: Freelancer_SpecializationCreateManyInput | Freelancer_SpecializationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Freelancer_Specialization createManyAndReturn
   */
  export type Freelancer_SpecializationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * The data used to create many Freelancer_Specializations.
     */
    data: Freelancer_SpecializationCreateManyInput | Freelancer_SpecializationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Freelancer_Specialization update
   */
  export type Freelancer_SpecializationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * The data needed to update a Freelancer_Specialization.
     */
    data: XOR<Freelancer_SpecializationUpdateInput, Freelancer_SpecializationUncheckedUpdateInput>
    /**
     * Choose, which Freelancer_Specialization to update.
     */
    where: Freelancer_SpecializationWhereUniqueInput
  }

  /**
   * Freelancer_Specialization updateMany
   */
  export type Freelancer_SpecializationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Freelancer_Specializations.
     */
    data: XOR<Freelancer_SpecializationUpdateManyMutationInput, Freelancer_SpecializationUncheckedUpdateManyInput>
    /**
     * Filter which Freelancer_Specializations to update
     */
    where?: Freelancer_SpecializationWhereInput
    /**
     * Limit how many Freelancer_Specializations to update.
     */
    limit?: number
  }

  /**
   * Freelancer_Specialization updateManyAndReturn
   */
  export type Freelancer_SpecializationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * The data used to update Freelancer_Specializations.
     */
    data: XOR<Freelancer_SpecializationUpdateManyMutationInput, Freelancer_SpecializationUncheckedUpdateManyInput>
    /**
     * Filter which Freelancer_Specializations to update
     */
    where?: Freelancer_SpecializationWhereInput
    /**
     * Limit how many Freelancer_Specializations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Freelancer_Specialization upsert
   */
  export type Freelancer_SpecializationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * The filter to search for the Freelancer_Specialization to update in case it exists.
     */
    where: Freelancer_SpecializationWhereUniqueInput
    /**
     * In case the Freelancer_Specialization found by the `where` argument doesn't exist, create a new Freelancer_Specialization with this data.
     */
    create: XOR<Freelancer_SpecializationCreateInput, Freelancer_SpecializationUncheckedCreateInput>
    /**
     * In case the Freelancer_Specialization was found with the provided `where` argument, update it with this data.
     */
    update: XOR<Freelancer_SpecializationUpdateInput, Freelancer_SpecializationUncheckedUpdateInput>
  }

  /**
   * Freelancer_Specialization delete
   */
  export type Freelancer_SpecializationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    /**
     * Filter which Freelancer_Specialization to delete.
     */
    where: Freelancer_SpecializationWhereUniqueInput
  }

  /**
   * Freelancer_Specialization deleteMany
   */
  export type Freelancer_SpecializationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Freelancer_Specializations to delete
     */
    where?: Freelancer_SpecializationWhereInput
    /**
     * Limit how many Freelancer_Specializations to delete.
     */
    limit?: number
  }

  /**
   * Freelancer_Specialization without action
   */
  export type Freelancer_SpecializationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
  }


  /**
   * Model Specialization
   */

  export type AggregateSpecialization = {
    _count: SpecializationCountAggregateOutputType | null
    _avg: SpecializationAvgAggregateOutputType | null
    _sum: SpecializationSumAggregateOutputType | null
    _min: SpecializationMinAggregateOutputType | null
    _max: SpecializationMaxAggregateOutputType | null
  }

  export type SpecializationAvgAggregateOutputType = {
    specializationID: number | null
  }

  export type SpecializationSumAggregateOutputType = {
    specializationID: number | null
  }

  export type SpecializationMinAggregateOutputType = {
    specializationID: number | null
    specializationName: string | null
  }

  export type SpecializationMaxAggregateOutputType = {
    specializationID: number | null
    specializationName: string | null
  }

  export type SpecializationCountAggregateOutputType = {
    specializationID: number
    specializationName: number
    _all: number
  }


  export type SpecializationAvgAggregateInputType = {
    specializationID?: true
  }

  export type SpecializationSumAggregateInputType = {
    specializationID?: true
  }

  export type SpecializationMinAggregateInputType = {
    specializationID?: true
    specializationName?: true
  }

  export type SpecializationMaxAggregateInputType = {
    specializationID?: true
    specializationName?: true
  }

  export type SpecializationCountAggregateInputType = {
    specializationID?: true
    specializationName?: true
    _all?: true
  }

  export type SpecializationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Specialization to aggregate.
     */
    where?: SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Specializations to fetch.
     */
    orderBy?: SpecializationOrderByWithRelationInput | SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Specializations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Specializations
    **/
    _count?: true | SpecializationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SpecializationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SpecializationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SpecializationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SpecializationMaxAggregateInputType
  }

  export type GetSpecializationAggregateType<T extends SpecializationAggregateArgs> = {
        [P in keyof T & keyof AggregateSpecialization]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpecialization[P]>
      : GetScalarType<T[P], AggregateSpecialization[P]>
  }




  export type SpecializationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpecializationWhereInput
    orderBy?: SpecializationOrderByWithAggregationInput | SpecializationOrderByWithAggregationInput[]
    by: SpecializationScalarFieldEnum[] | SpecializationScalarFieldEnum
    having?: SpecializationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpecializationCountAggregateInputType | true
    _avg?: SpecializationAvgAggregateInputType
    _sum?: SpecializationSumAggregateInputType
    _min?: SpecializationMinAggregateInputType
    _max?: SpecializationMaxAggregateInputType
  }

  export type SpecializationGroupByOutputType = {
    specializationID: number
    specializationName: string
    _count: SpecializationCountAggregateOutputType | null
    _avg: SpecializationAvgAggregateOutputType | null
    _sum: SpecializationSumAggregateOutputType | null
    _min: SpecializationMinAggregateOutputType | null
    _max: SpecializationMaxAggregateOutputType | null
  }

  type GetSpecializationGroupByPayload<T extends SpecializationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpecializationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpecializationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpecializationGroupByOutputType[P]>
            : GetScalarType<T[P], SpecializationGroupByOutputType[P]>
        }
      >
    >


  export type SpecializationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    specializationID?: boolean
    specializationName?: boolean
    freelancer_specialization?: boolean | Specialization$freelancer_specializationArgs<ExtArgs>
    _count?: boolean | SpecializationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["specialization"]>

  export type SpecializationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    specializationID?: boolean
    specializationName?: boolean
  }, ExtArgs["result"]["specialization"]>

  export type SpecializationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    specializationID?: boolean
    specializationName?: boolean
  }, ExtArgs["result"]["specialization"]>

  export type SpecializationSelectScalar = {
    specializationID?: boolean
    specializationName?: boolean
  }

  export type SpecializationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"specializationID" | "specializationName", ExtArgs["result"]["specialization"]>
  export type SpecializationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    freelancer_specialization?: boolean | Specialization$freelancer_specializationArgs<ExtArgs>
    _count?: boolean | SpecializationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SpecializationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SpecializationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SpecializationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Specialization"
    objects: {
      freelancer_specialization: Prisma.$Freelancer_SpecializationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      specializationID: number
      specializationName: string
    }, ExtArgs["result"]["specialization"]>
    composites: {}
  }

  type SpecializationGetPayload<S extends boolean | null | undefined | SpecializationDefaultArgs> = $Result.GetResult<Prisma.$SpecializationPayload, S>

  type SpecializationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SpecializationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SpecializationCountAggregateInputType | true
    }

  export interface SpecializationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Specialization'], meta: { name: 'Specialization' } }
    /**
     * Find zero or one Specialization that matches the filter.
     * @param {SpecializationFindUniqueArgs} args - Arguments to find a Specialization
     * @example
     * // Get one Specialization
     * const specialization = await prisma.specialization.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpecializationFindUniqueArgs>(args: SelectSubset<T, SpecializationFindUniqueArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Specialization that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SpecializationFindUniqueOrThrowArgs} args - Arguments to find a Specialization
     * @example
     * // Get one Specialization
     * const specialization = await prisma.specialization.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpecializationFindUniqueOrThrowArgs>(args: SelectSubset<T, SpecializationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Specialization that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpecializationFindFirstArgs} args - Arguments to find a Specialization
     * @example
     * // Get one Specialization
     * const specialization = await prisma.specialization.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpecializationFindFirstArgs>(args?: SelectSubset<T, SpecializationFindFirstArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Specialization that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpecializationFindFirstOrThrowArgs} args - Arguments to find a Specialization
     * @example
     * // Get one Specialization
     * const specialization = await prisma.specialization.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpecializationFindFirstOrThrowArgs>(args?: SelectSubset<T, SpecializationFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Specializations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpecializationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Specializations
     * const specializations = await prisma.specialization.findMany()
     * 
     * // Get first 10 Specializations
     * const specializations = await prisma.specialization.findMany({ take: 10 })
     * 
     * // Only select the `specializationID`
     * const specializationWithSpecializationIDOnly = await prisma.specialization.findMany({ select: { specializationID: true } })
     * 
     */
    findMany<T extends SpecializationFindManyArgs>(args?: SelectSubset<T, SpecializationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Specialization.
     * @param {SpecializationCreateArgs} args - Arguments to create a Specialization.
     * @example
     * // Create one Specialization
     * const Specialization = await prisma.specialization.create({
     *   data: {
     *     // ... data to create a Specialization
     *   }
     * })
     * 
     */
    create<T extends SpecializationCreateArgs>(args: SelectSubset<T, SpecializationCreateArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Specializations.
     * @param {SpecializationCreateManyArgs} args - Arguments to create many Specializations.
     * @example
     * // Create many Specializations
     * const specialization = await prisma.specialization.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SpecializationCreateManyArgs>(args?: SelectSubset<T, SpecializationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Specializations and returns the data saved in the database.
     * @param {SpecializationCreateManyAndReturnArgs} args - Arguments to create many Specializations.
     * @example
     * // Create many Specializations
     * const specialization = await prisma.specialization.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Specializations and only return the `specializationID`
     * const specializationWithSpecializationIDOnly = await prisma.specialization.createManyAndReturn({
     *   select: { specializationID: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SpecializationCreateManyAndReturnArgs>(args?: SelectSubset<T, SpecializationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Specialization.
     * @param {SpecializationDeleteArgs} args - Arguments to delete one Specialization.
     * @example
     * // Delete one Specialization
     * const Specialization = await prisma.specialization.delete({
     *   where: {
     *     // ... filter to delete one Specialization
     *   }
     * })
     * 
     */
    delete<T extends SpecializationDeleteArgs>(args: SelectSubset<T, SpecializationDeleteArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Specialization.
     * @param {SpecializationUpdateArgs} args - Arguments to update one Specialization.
     * @example
     * // Update one Specialization
     * const specialization = await prisma.specialization.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SpecializationUpdateArgs>(args: SelectSubset<T, SpecializationUpdateArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Specializations.
     * @param {SpecializationDeleteManyArgs} args - Arguments to filter Specializations to delete.
     * @example
     * // Delete a few Specializations
     * const { count } = await prisma.specialization.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SpecializationDeleteManyArgs>(args?: SelectSubset<T, SpecializationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Specializations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpecializationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Specializations
     * const specialization = await prisma.specialization.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SpecializationUpdateManyArgs>(args: SelectSubset<T, SpecializationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Specializations and returns the data updated in the database.
     * @param {SpecializationUpdateManyAndReturnArgs} args - Arguments to update many Specializations.
     * @example
     * // Update many Specializations
     * const specialization = await prisma.specialization.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Specializations and only return the `specializationID`
     * const specializationWithSpecializationIDOnly = await prisma.specialization.updateManyAndReturn({
     *   select: { specializationID: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SpecializationUpdateManyAndReturnArgs>(args: SelectSubset<T, SpecializationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Specialization.
     * @param {SpecializationUpsertArgs} args - Arguments to update or create a Specialization.
     * @example
     * // Update or create a Specialization
     * const specialization = await prisma.specialization.upsert({
     *   create: {
     *     // ... data to create a Specialization
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Specialization we want to update
     *   }
     * })
     */
    upsert<T extends SpecializationUpsertArgs>(args: SelectSubset<T, SpecializationUpsertArgs<ExtArgs>>): Prisma__SpecializationClient<$Result.GetResult<Prisma.$SpecializationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Specializations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpecializationCountArgs} args - Arguments to filter Specializations to count.
     * @example
     * // Count the number of Specializations
     * const count = await prisma.specialization.count({
     *   where: {
     *     // ... the filter for the Specializations we want to count
     *   }
     * })
    **/
    count<T extends SpecializationCountArgs>(
      args?: Subset<T, SpecializationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpecializationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Specialization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpecializationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpecializationAggregateArgs>(args: Subset<T, SpecializationAggregateArgs>): Prisma.PrismaPromise<GetSpecializationAggregateType<T>>

    /**
     * Group by Specialization.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpecializationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SpecializationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpecializationGroupByArgs['orderBy'] }
        : { orderBy?: SpecializationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpecializationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpecializationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Specialization model
   */
  readonly fields: SpecializationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Specialization.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpecializationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    freelancer_specialization<T extends Specialization$freelancer_specializationArgs<ExtArgs> = {}>(args?: Subset<T, Specialization$freelancer_specializationArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Freelancer_SpecializationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Specialization model
   */
  interface SpecializationFieldRefs {
    readonly specializationID: FieldRef<"Specialization", 'Int'>
    readonly specializationName: FieldRef<"Specialization", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Specialization findUnique
   */
  export type SpecializationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Specialization to fetch.
     */
    where: SpecializationWhereUniqueInput
  }

  /**
   * Specialization findUniqueOrThrow
   */
  export type SpecializationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Specialization to fetch.
     */
    where: SpecializationWhereUniqueInput
  }

  /**
   * Specialization findFirst
   */
  export type SpecializationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Specialization to fetch.
     */
    where?: SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Specializations to fetch.
     */
    orderBy?: SpecializationOrderByWithRelationInput | SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Specializations.
     */
    cursor?: SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Specializations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Specializations.
     */
    distinct?: SpecializationScalarFieldEnum | SpecializationScalarFieldEnum[]
  }

  /**
   * Specialization findFirstOrThrow
   */
  export type SpecializationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Specialization to fetch.
     */
    where?: SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Specializations to fetch.
     */
    orderBy?: SpecializationOrderByWithRelationInput | SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Specializations.
     */
    cursor?: SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Specializations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Specializations.
     */
    distinct?: SpecializationScalarFieldEnum | SpecializationScalarFieldEnum[]
  }

  /**
   * Specialization findMany
   */
  export type SpecializationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * Filter, which Specializations to fetch.
     */
    where?: SpecializationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Specializations to fetch.
     */
    orderBy?: SpecializationOrderByWithRelationInput | SpecializationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Specializations.
     */
    cursor?: SpecializationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Specializations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Specializations.
     */
    skip?: number
    distinct?: SpecializationScalarFieldEnum | SpecializationScalarFieldEnum[]
  }

  /**
   * Specialization create
   */
  export type SpecializationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * The data needed to create a Specialization.
     */
    data: XOR<SpecializationCreateInput, SpecializationUncheckedCreateInput>
  }

  /**
   * Specialization createMany
   */
  export type SpecializationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Specializations.
     */
    data: SpecializationCreateManyInput | SpecializationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Specialization createManyAndReturn
   */
  export type SpecializationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * The data used to create many Specializations.
     */
    data: SpecializationCreateManyInput | SpecializationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Specialization update
   */
  export type SpecializationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * The data needed to update a Specialization.
     */
    data: XOR<SpecializationUpdateInput, SpecializationUncheckedUpdateInput>
    /**
     * Choose, which Specialization to update.
     */
    where: SpecializationWhereUniqueInput
  }

  /**
   * Specialization updateMany
   */
  export type SpecializationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Specializations.
     */
    data: XOR<SpecializationUpdateManyMutationInput, SpecializationUncheckedUpdateManyInput>
    /**
     * Filter which Specializations to update
     */
    where?: SpecializationWhereInput
    /**
     * Limit how many Specializations to update.
     */
    limit?: number
  }

  /**
   * Specialization updateManyAndReturn
   */
  export type SpecializationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * The data used to update Specializations.
     */
    data: XOR<SpecializationUpdateManyMutationInput, SpecializationUncheckedUpdateManyInput>
    /**
     * Filter which Specializations to update
     */
    where?: SpecializationWhereInput
    /**
     * Limit how many Specializations to update.
     */
    limit?: number
  }

  /**
   * Specialization upsert
   */
  export type SpecializationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * The filter to search for the Specialization to update in case it exists.
     */
    where: SpecializationWhereUniqueInput
    /**
     * In case the Specialization found by the `where` argument doesn't exist, create a new Specialization with this data.
     */
    create: XOR<SpecializationCreateInput, SpecializationUncheckedCreateInput>
    /**
     * In case the Specialization was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpecializationUpdateInput, SpecializationUncheckedUpdateInput>
  }

  /**
   * Specialization delete
   */
  export type SpecializationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
    /**
     * Filter which Specialization to delete.
     */
    where: SpecializationWhereUniqueInput
  }

  /**
   * Specialization deleteMany
   */
  export type SpecializationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Specializations to delete
     */
    where?: SpecializationWhereInput
    /**
     * Limit how many Specializations to delete.
     */
    limit?: number
  }

  /**
   * Specialization.freelancer_specialization
   */
  export type Specialization$freelancer_specializationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Freelancer_Specialization
     */
    select?: Freelancer_SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Freelancer_Specialization
     */
    omit?: Freelancer_SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Freelancer_SpecializationInclude<ExtArgs> | null
    where?: Freelancer_SpecializationWhereInput
    orderBy?: Freelancer_SpecializationOrderByWithRelationInput | Freelancer_SpecializationOrderByWithRelationInput[]
    cursor?: Freelancer_SpecializationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Freelancer_SpecializationScalarFieldEnum | Freelancer_SpecializationScalarFieldEnum[]
  }

  /**
   * Specialization without action
   */
  export type SpecializationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Specialization
     */
    select?: SpecializationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Specialization
     */
    omit?: SpecializationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpecializationInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AccountsScalarFieldEnum: {
    accountID: 'accountID',
    email: 'email',
    password: 'password',
    isVerified: 'isVerified',
    createdAt: 'createdAt',
    status: 'status'
  };

  export type AccountsScalarFieldEnum = (typeof AccountsScalarFieldEnum)[keyof typeof AccountsScalarFieldEnum]


  export const ProfileScalarFieldEnum: {
    profileID: 'profileID',
    accountID: 'accountID',
    firstName: 'firstName',
    lastName: 'lastName',
    username: 'username',
    contactNum: 'contactNum',
    profileType: 'profileType'
  };

  export type ProfileScalarFieldEnum = (typeof ProfileScalarFieldEnum)[keyof typeof ProfileScalarFieldEnum]


  export const Worker_ProfileScalarFieldEnum: {
    profileID: 'profileID',
    profileImg: 'profileImg',
    hourlyRate: 'hourlyRate',
    verifiedSkills: 'verifiedSkills',
    responseTimeAvg: 'responseTimeAvg',
    completionRate: 'completionRate',
    bio: 'bio',
    totalEarningGross: 'totalEarningGross',
    withholdingBalance: 'withholdingBalance',
    description: 'description',
    availabilityStatus: 'availabilityStatus'
  };

  export type Worker_ProfileScalarFieldEnum = (typeof Worker_ProfileScalarFieldEnum)[keyof typeof Worker_ProfileScalarFieldEnum]


  export const Freelancer_SpecializationScalarFieldEnum: {
    workerID: 'workerID',
    specializationID: 'specializationID',
    experienceYears: 'experienceYears',
    certification: 'certification'
  };

  export type Freelancer_SpecializationScalarFieldEnum = (typeof Freelancer_SpecializationScalarFieldEnum)[keyof typeof Freelancer_SpecializationScalarFieldEnum]


  export const SpecializationScalarFieldEnum: {
    specializationID: 'specializationID',
    specializationName: 'specializationName'
  };

  export type SpecializationScalarFieldEnum = (typeof SpecializationScalarFieldEnum)[keyof typeof SpecializationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'profileType'
   */
  export type EnumprofileTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'profileType'>
    


  /**
   * Reference to a field of type 'profileType[]'
   */
  export type ListEnumprofileTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'profileType[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'availabilityStatus'
   */
  export type EnumavailabilityStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'availabilityStatus'>
    


  /**
   * Reference to a field of type 'availabilityStatus[]'
   */
  export type ListEnumavailabilityStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'availabilityStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type AccountsWhereInput = {
    AND?: AccountsWhereInput | AccountsWhereInput[]
    OR?: AccountsWhereInput[]
    NOT?: AccountsWhereInput | AccountsWhereInput[]
    accountID?: IntFilter<"Accounts"> | number
    email?: StringFilter<"Accounts"> | string
    password?: StringFilter<"Accounts"> | string
    isVerified?: BoolFilter<"Accounts"> | boolean
    createdAt?: DateTimeFilter<"Accounts"> | Date | string
    status?: StringFilter<"Accounts"> | string
    profile?: ProfileListRelationFilter
  }

  export type AccountsOrderByWithRelationInput = {
    accountID?: SortOrder
    email?: SortOrder
    password?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
    profile?: ProfileOrderByRelationAggregateInput
  }

  export type AccountsWhereUniqueInput = Prisma.AtLeast<{
    accountID?: number
    email?: string
    AND?: AccountsWhereInput | AccountsWhereInput[]
    OR?: AccountsWhereInput[]
    NOT?: AccountsWhereInput | AccountsWhereInput[]
    password?: StringFilter<"Accounts"> | string
    isVerified?: BoolFilter<"Accounts"> | boolean
    createdAt?: DateTimeFilter<"Accounts"> | Date | string
    status?: StringFilter<"Accounts"> | string
    profile?: ProfileListRelationFilter
  }, "accountID" | "email">

  export type AccountsOrderByWithAggregationInput = {
    accountID?: SortOrder
    email?: SortOrder
    password?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
    _count?: AccountsCountOrderByAggregateInput
    _avg?: AccountsAvgOrderByAggregateInput
    _max?: AccountsMaxOrderByAggregateInput
    _min?: AccountsMinOrderByAggregateInput
    _sum?: AccountsSumOrderByAggregateInput
  }

  export type AccountsScalarWhereWithAggregatesInput = {
    AND?: AccountsScalarWhereWithAggregatesInput | AccountsScalarWhereWithAggregatesInput[]
    OR?: AccountsScalarWhereWithAggregatesInput[]
    NOT?: AccountsScalarWhereWithAggregatesInput | AccountsScalarWhereWithAggregatesInput[]
    accountID?: IntWithAggregatesFilter<"Accounts"> | number
    email?: StringWithAggregatesFilter<"Accounts"> | string
    password?: StringWithAggregatesFilter<"Accounts"> | string
    isVerified?: BoolWithAggregatesFilter<"Accounts"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Accounts"> | Date | string
    status?: StringWithAggregatesFilter<"Accounts"> | string
  }

  export type ProfileWhereInput = {
    AND?: ProfileWhereInput | ProfileWhereInput[]
    OR?: ProfileWhereInput[]
    NOT?: ProfileWhereInput | ProfileWhereInput[]
    profileID?: IntFilter<"Profile"> | number
    accountID?: IntFilter<"Profile"> | number
    firstName?: StringFilter<"Profile"> | string
    lastName?: StringFilter<"Profile"> | string
    username?: StringFilter<"Profile"> | string
    contactNum?: StringFilter<"Profile"> | string
    profileType?: EnumprofileTypeNullableFilter<"Profile"> | $Enums.profileType | null
    worker?: XOR<Worker_ProfileNullableScalarRelationFilter, Worker_ProfileWhereInput> | null
    accounts?: XOR<AccountsScalarRelationFilter, AccountsWhereInput>
  }

  export type ProfileOrderByWithRelationInput = {
    profileID?: SortOrder
    accountID?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    contactNum?: SortOrder
    profileType?: SortOrderInput | SortOrder
    worker?: Worker_ProfileOrderByWithRelationInput
    accounts?: AccountsOrderByWithRelationInput
  }

  export type ProfileWhereUniqueInput = Prisma.AtLeast<{
    profileID?: number
    accountID?: number
    AND?: ProfileWhereInput | ProfileWhereInput[]
    OR?: ProfileWhereInput[]
    NOT?: ProfileWhereInput | ProfileWhereInput[]
    firstName?: StringFilter<"Profile"> | string
    lastName?: StringFilter<"Profile"> | string
    username?: StringFilter<"Profile"> | string
    contactNum?: StringFilter<"Profile"> | string
    profileType?: EnumprofileTypeNullableFilter<"Profile"> | $Enums.profileType | null
    worker?: XOR<Worker_ProfileNullableScalarRelationFilter, Worker_ProfileWhereInput> | null
    accounts?: XOR<AccountsScalarRelationFilter, AccountsWhereInput>
  }, "profileID" | "accountID">

  export type ProfileOrderByWithAggregationInput = {
    profileID?: SortOrder
    accountID?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    contactNum?: SortOrder
    profileType?: SortOrderInput | SortOrder
    _count?: ProfileCountOrderByAggregateInput
    _avg?: ProfileAvgOrderByAggregateInput
    _max?: ProfileMaxOrderByAggregateInput
    _min?: ProfileMinOrderByAggregateInput
    _sum?: ProfileSumOrderByAggregateInput
  }

  export type ProfileScalarWhereWithAggregatesInput = {
    AND?: ProfileScalarWhereWithAggregatesInput | ProfileScalarWhereWithAggregatesInput[]
    OR?: ProfileScalarWhereWithAggregatesInput[]
    NOT?: ProfileScalarWhereWithAggregatesInput | ProfileScalarWhereWithAggregatesInput[]
    profileID?: IntWithAggregatesFilter<"Profile"> | number
    accountID?: IntWithAggregatesFilter<"Profile"> | number
    firstName?: StringWithAggregatesFilter<"Profile"> | string
    lastName?: StringWithAggregatesFilter<"Profile"> | string
    username?: StringWithAggregatesFilter<"Profile"> | string
    contactNum?: StringWithAggregatesFilter<"Profile"> | string
    profileType?: EnumprofileTypeNullableWithAggregatesFilter<"Profile"> | $Enums.profileType | null
  }

  export type Worker_ProfileWhereInput = {
    AND?: Worker_ProfileWhereInput | Worker_ProfileWhereInput[]
    OR?: Worker_ProfileWhereInput[]
    NOT?: Worker_ProfileWhereInput | Worker_ProfileWhereInput[]
    profileID?: IntFilter<"Worker_Profile"> | number
    profileImg?: StringNullableFilter<"Worker_Profile"> | string | null
    hourlyRate?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonFilter<"Worker_Profile">
    responseTimeAvg?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    bio?: StringFilter<"Worker_Profile"> | string
    totalEarningGross?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    description?: StringFilter<"Worker_Profile"> | string
    availabilityStatus?: EnumavailabilityStatusFilter<"Worker_Profile"> | $Enums.availabilityStatus
    profile?: XOR<ProfileNullableScalarRelationFilter, ProfileWhereInput> | null
    freelancer_specialization?: Freelancer_SpecializationListRelationFilter
  }

  export type Worker_ProfileOrderByWithRelationInput = {
    profileID?: SortOrder
    profileImg?: SortOrderInput | SortOrder
    hourlyRate?: SortOrder
    verifiedSkills?: SortOrder
    responseTimeAvg?: SortOrder
    completionRate?: SortOrder
    bio?: SortOrder
    totalEarningGross?: SortOrder
    withholdingBalance?: SortOrder
    description?: SortOrder
    availabilityStatus?: SortOrder
    profile?: ProfileOrderByWithRelationInput
    freelancer_specialization?: Freelancer_SpecializationOrderByRelationAggregateInput
  }

  export type Worker_ProfileWhereUniqueInput = Prisma.AtLeast<{
    profileID?: number
    AND?: Worker_ProfileWhereInput | Worker_ProfileWhereInput[]
    OR?: Worker_ProfileWhereInput[]
    NOT?: Worker_ProfileWhereInput | Worker_ProfileWhereInput[]
    profileImg?: StringNullableFilter<"Worker_Profile"> | string | null
    hourlyRate?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonFilter<"Worker_Profile">
    responseTimeAvg?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    bio?: StringFilter<"Worker_Profile"> | string
    totalEarningGross?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    description?: StringFilter<"Worker_Profile"> | string
    availabilityStatus?: EnumavailabilityStatusFilter<"Worker_Profile"> | $Enums.availabilityStatus
    profile?: XOR<ProfileNullableScalarRelationFilter, ProfileWhereInput> | null
    freelancer_specialization?: Freelancer_SpecializationListRelationFilter
  }, "profileID">

  export type Worker_ProfileOrderByWithAggregationInput = {
    profileID?: SortOrder
    profileImg?: SortOrderInput | SortOrder
    hourlyRate?: SortOrder
    verifiedSkills?: SortOrder
    responseTimeAvg?: SortOrder
    completionRate?: SortOrder
    bio?: SortOrder
    totalEarningGross?: SortOrder
    withholdingBalance?: SortOrder
    description?: SortOrder
    availabilityStatus?: SortOrder
    _count?: Worker_ProfileCountOrderByAggregateInput
    _avg?: Worker_ProfileAvgOrderByAggregateInput
    _max?: Worker_ProfileMaxOrderByAggregateInput
    _min?: Worker_ProfileMinOrderByAggregateInput
    _sum?: Worker_ProfileSumOrderByAggregateInput
  }

  export type Worker_ProfileScalarWhereWithAggregatesInput = {
    AND?: Worker_ProfileScalarWhereWithAggregatesInput | Worker_ProfileScalarWhereWithAggregatesInput[]
    OR?: Worker_ProfileScalarWhereWithAggregatesInput[]
    NOT?: Worker_ProfileScalarWhereWithAggregatesInput | Worker_ProfileScalarWhereWithAggregatesInput[]
    profileID?: IntWithAggregatesFilter<"Worker_Profile"> | number
    profileImg?: StringNullableWithAggregatesFilter<"Worker_Profile"> | string | null
    hourlyRate?: DecimalWithAggregatesFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonWithAggregatesFilter<"Worker_Profile">
    responseTimeAvg?: DecimalWithAggregatesFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalWithAggregatesFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    bio?: StringWithAggregatesFilter<"Worker_Profile"> | string
    totalEarningGross?: DecimalWithAggregatesFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalWithAggregatesFilter<"Worker_Profile"> | Decimal | DecimalJsLike | number | string
    description?: StringWithAggregatesFilter<"Worker_Profile"> | string
    availabilityStatus?: EnumavailabilityStatusWithAggregatesFilter<"Worker_Profile"> | $Enums.availabilityStatus
  }

  export type Freelancer_SpecializationWhereInput = {
    AND?: Freelancer_SpecializationWhereInput | Freelancer_SpecializationWhereInput[]
    OR?: Freelancer_SpecializationWhereInput[]
    NOT?: Freelancer_SpecializationWhereInput | Freelancer_SpecializationWhereInput[]
    workerID?: IntFilter<"Freelancer_Specialization"> | number
    specializationID?: IntFilter<"Freelancer_Specialization"> | number
    experienceYears?: IntFilter<"Freelancer_Specialization"> | number
    certification?: StringFilter<"Freelancer_Specialization"> | string
    worker_profile?: XOR<Worker_ProfileScalarRelationFilter, Worker_ProfileWhereInput>
    specialization?: XOR<SpecializationScalarRelationFilter, SpecializationWhereInput>
  }

  export type Freelancer_SpecializationOrderByWithRelationInput = {
    workerID?: SortOrder
    specializationID?: SortOrder
    experienceYears?: SortOrder
    certification?: SortOrder
    worker_profile?: Worker_ProfileOrderByWithRelationInput
    specialization?: SpecializationOrderByWithRelationInput
  }

  export type Freelancer_SpecializationWhereUniqueInput = Prisma.AtLeast<{
    workerID_specializationID?: Freelancer_SpecializationWorkerIDSpecializationIDCompoundUniqueInput
    AND?: Freelancer_SpecializationWhereInput | Freelancer_SpecializationWhereInput[]
    OR?: Freelancer_SpecializationWhereInput[]
    NOT?: Freelancer_SpecializationWhereInput | Freelancer_SpecializationWhereInput[]
    workerID?: IntFilter<"Freelancer_Specialization"> | number
    specializationID?: IntFilter<"Freelancer_Specialization"> | number
    experienceYears?: IntFilter<"Freelancer_Specialization"> | number
    certification?: StringFilter<"Freelancer_Specialization"> | string
    worker_profile?: XOR<Worker_ProfileScalarRelationFilter, Worker_ProfileWhereInput>
    specialization?: XOR<SpecializationScalarRelationFilter, SpecializationWhereInput>
  }, "workerID_specializationID">

  export type Freelancer_SpecializationOrderByWithAggregationInput = {
    workerID?: SortOrder
    specializationID?: SortOrder
    experienceYears?: SortOrder
    certification?: SortOrder
    _count?: Freelancer_SpecializationCountOrderByAggregateInput
    _avg?: Freelancer_SpecializationAvgOrderByAggregateInput
    _max?: Freelancer_SpecializationMaxOrderByAggregateInput
    _min?: Freelancer_SpecializationMinOrderByAggregateInput
    _sum?: Freelancer_SpecializationSumOrderByAggregateInput
  }

  export type Freelancer_SpecializationScalarWhereWithAggregatesInput = {
    AND?: Freelancer_SpecializationScalarWhereWithAggregatesInput | Freelancer_SpecializationScalarWhereWithAggregatesInput[]
    OR?: Freelancer_SpecializationScalarWhereWithAggregatesInput[]
    NOT?: Freelancer_SpecializationScalarWhereWithAggregatesInput | Freelancer_SpecializationScalarWhereWithAggregatesInput[]
    workerID?: IntWithAggregatesFilter<"Freelancer_Specialization"> | number
    specializationID?: IntWithAggregatesFilter<"Freelancer_Specialization"> | number
    experienceYears?: IntWithAggregatesFilter<"Freelancer_Specialization"> | number
    certification?: StringWithAggregatesFilter<"Freelancer_Specialization"> | string
  }

  export type SpecializationWhereInput = {
    AND?: SpecializationWhereInput | SpecializationWhereInput[]
    OR?: SpecializationWhereInput[]
    NOT?: SpecializationWhereInput | SpecializationWhereInput[]
    specializationID?: IntFilter<"Specialization"> | number
    specializationName?: StringFilter<"Specialization"> | string
    freelancer_specialization?: Freelancer_SpecializationListRelationFilter
  }

  export type SpecializationOrderByWithRelationInput = {
    specializationID?: SortOrder
    specializationName?: SortOrder
    freelancer_specialization?: Freelancer_SpecializationOrderByRelationAggregateInput
  }

  export type SpecializationWhereUniqueInput = Prisma.AtLeast<{
    specializationID?: number
    AND?: SpecializationWhereInput | SpecializationWhereInput[]
    OR?: SpecializationWhereInput[]
    NOT?: SpecializationWhereInput | SpecializationWhereInput[]
    specializationName?: StringFilter<"Specialization"> | string
    freelancer_specialization?: Freelancer_SpecializationListRelationFilter
  }, "specializationID" | "specializationID">

  export type SpecializationOrderByWithAggregationInput = {
    specializationID?: SortOrder
    specializationName?: SortOrder
    _count?: SpecializationCountOrderByAggregateInput
    _avg?: SpecializationAvgOrderByAggregateInput
    _max?: SpecializationMaxOrderByAggregateInput
    _min?: SpecializationMinOrderByAggregateInput
    _sum?: SpecializationSumOrderByAggregateInput
  }

  export type SpecializationScalarWhereWithAggregatesInput = {
    AND?: SpecializationScalarWhereWithAggregatesInput | SpecializationScalarWhereWithAggregatesInput[]
    OR?: SpecializationScalarWhereWithAggregatesInput[]
    NOT?: SpecializationScalarWhereWithAggregatesInput | SpecializationScalarWhereWithAggregatesInput[]
    specializationID?: IntWithAggregatesFilter<"Specialization"> | number
    specializationName?: StringWithAggregatesFilter<"Specialization"> | string
  }

  export type AccountsCreateInput = {
    email: string
    password: string
    isVerified: boolean
    createdAt: Date | string
    status: string
    profile?: ProfileCreateNestedManyWithoutAccountsInput
  }

  export type AccountsUncheckedCreateInput = {
    accountID?: number
    email: string
    password: string
    isVerified: boolean
    createdAt: Date | string
    status: string
    profile?: ProfileUncheckedCreateNestedManyWithoutAccountsInput
  }

  export type AccountsUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    profile?: ProfileUpdateManyWithoutAccountsNestedInput
  }

  export type AccountsUncheckedUpdateInput = {
    accountID?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    profile?: ProfileUncheckedUpdateManyWithoutAccountsNestedInput
  }

  export type AccountsCreateManyInput = {
    accountID?: number
    email: string
    password: string
    isVerified: boolean
    createdAt: Date | string
    status: string
  }

  export type AccountsUpdateManyMutationInput = {
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
  }

  export type AccountsUncheckedUpdateManyInput = {
    accountID?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
  }

  export type ProfileCreateInput = {
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
    worker?: Worker_ProfileCreateNestedOneWithoutProfileInput
    accounts: AccountsCreateNestedOneWithoutProfileInput
  }

  export type ProfileUncheckedCreateInput = {
    profileID?: number
    accountID: number
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
    worker?: Worker_ProfileUncheckedCreateNestedOneWithoutProfileInput
  }

  export type ProfileUpdateInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
    worker?: Worker_ProfileUpdateOneWithoutProfileNestedInput
    accounts?: AccountsUpdateOneRequiredWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    accountID?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
    worker?: Worker_ProfileUncheckedUpdateOneWithoutProfileNestedInput
  }

  export type ProfileCreateManyInput = {
    profileID?: number
    accountID: number
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
  }

  export type ProfileUpdateManyMutationInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
  }

  export type ProfileUncheckedUpdateManyInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    accountID?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
  }

  export type Worker_ProfileCreateInput = {
    profileImg?: string | null
    hourlyRate: Decimal | DecimalJsLike | number | string
    verifiedSkills: JsonNullValueInput | InputJsonValue
    responseTimeAvg: Decimal | DecimalJsLike | number | string
    completionRate: Decimal | DecimalJsLike | number | string
    bio: string
    totalEarningGross: Decimal | DecimalJsLike | number | string
    withholdingBalance: Decimal | DecimalJsLike | number | string
    description: string
    availabilityStatus?: $Enums.availabilityStatus
    profile?: ProfileCreateNestedOneWithoutWorkerInput
    freelancer_specialization?: Freelancer_SpecializationCreateNestedManyWithoutWorker_profileInput
  }

  export type Worker_ProfileUncheckedCreateInput = {
    profileID: number
    profileImg?: string | null
    hourlyRate: Decimal | DecimalJsLike | number | string
    verifiedSkills: JsonNullValueInput | InputJsonValue
    responseTimeAvg: Decimal | DecimalJsLike | number | string
    completionRate: Decimal | DecimalJsLike | number | string
    bio: string
    totalEarningGross: Decimal | DecimalJsLike | number | string
    withholdingBalance: Decimal | DecimalJsLike | number | string
    description: string
    availabilityStatus?: $Enums.availabilityStatus
    freelancer_specialization?: Freelancer_SpecializationUncheckedCreateNestedManyWithoutWorker_profileInput
  }

  export type Worker_ProfileUpdateInput = {
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
    profile?: ProfileUpdateOneWithoutWorkerNestedInput
    freelancer_specialization?: Freelancer_SpecializationUpdateManyWithoutWorker_profileNestedInput
  }

  export type Worker_ProfileUncheckedUpdateInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
    freelancer_specialization?: Freelancer_SpecializationUncheckedUpdateManyWithoutWorker_profileNestedInput
  }

  export type Worker_ProfileCreateManyInput = {
    profileID: number
    profileImg?: string | null
    hourlyRate: Decimal | DecimalJsLike | number | string
    verifiedSkills: JsonNullValueInput | InputJsonValue
    responseTimeAvg: Decimal | DecimalJsLike | number | string
    completionRate: Decimal | DecimalJsLike | number | string
    bio: string
    totalEarningGross: Decimal | DecimalJsLike | number | string
    withholdingBalance: Decimal | DecimalJsLike | number | string
    description: string
    availabilityStatus?: $Enums.availabilityStatus
  }

  export type Worker_ProfileUpdateManyMutationInput = {
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
  }

  export type Worker_ProfileUncheckedUpdateManyInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
  }

  export type Freelancer_SpecializationCreateInput = {
    experienceYears: number
    certification: string
    worker_profile: Worker_ProfileCreateNestedOneWithoutFreelancer_specializationInput
    specialization: SpecializationCreateNestedOneWithoutFreelancer_specializationInput
  }

  export type Freelancer_SpecializationUncheckedCreateInput = {
    workerID: number
    specializationID: number
    experienceYears: number
    certification: string
  }

  export type Freelancer_SpecializationUpdateInput = {
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
    worker_profile?: Worker_ProfileUpdateOneRequiredWithoutFreelancer_specializationNestedInput
    specialization?: SpecializationUpdateOneRequiredWithoutFreelancer_specializationNestedInput
  }

  export type Freelancer_SpecializationUncheckedUpdateInput = {
    workerID?: IntFieldUpdateOperationsInput | number
    specializationID?: IntFieldUpdateOperationsInput | number
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
  }

  export type Freelancer_SpecializationCreateManyInput = {
    workerID: number
    specializationID: number
    experienceYears: number
    certification: string
  }

  export type Freelancer_SpecializationUpdateManyMutationInput = {
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
  }

  export type Freelancer_SpecializationUncheckedUpdateManyInput = {
    workerID?: IntFieldUpdateOperationsInput | number
    specializationID?: IntFieldUpdateOperationsInput | number
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
  }

  export type SpecializationCreateInput = {
    specializationName: string
    freelancer_specialization?: Freelancer_SpecializationCreateNestedManyWithoutSpecializationInput
  }

  export type SpecializationUncheckedCreateInput = {
    specializationID?: number
    specializationName: string
    freelancer_specialization?: Freelancer_SpecializationUncheckedCreateNestedManyWithoutSpecializationInput
  }

  export type SpecializationUpdateInput = {
    specializationName?: StringFieldUpdateOperationsInput | string
    freelancer_specialization?: Freelancer_SpecializationUpdateManyWithoutSpecializationNestedInput
  }

  export type SpecializationUncheckedUpdateInput = {
    specializationID?: IntFieldUpdateOperationsInput | number
    specializationName?: StringFieldUpdateOperationsInput | string
    freelancer_specialization?: Freelancer_SpecializationUncheckedUpdateManyWithoutSpecializationNestedInput
  }

  export type SpecializationCreateManyInput = {
    specializationID?: number
    specializationName: string
  }

  export type SpecializationUpdateManyMutationInput = {
    specializationName?: StringFieldUpdateOperationsInput | string
  }

  export type SpecializationUncheckedUpdateManyInput = {
    specializationID?: IntFieldUpdateOperationsInput | number
    specializationName?: StringFieldUpdateOperationsInput | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ProfileListRelationFilter = {
    every?: ProfileWhereInput
    some?: ProfileWhereInput
    none?: ProfileWhereInput
  }

  export type ProfileOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AccountsCountOrderByAggregateInput = {
    accountID?: SortOrder
    email?: SortOrder
    password?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
  }

  export type AccountsAvgOrderByAggregateInput = {
    accountID?: SortOrder
  }

  export type AccountsMaxOrderByAggregateInput = {
    accountID?: SortOrder
    email?: SortOrder
    password?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
  }

  export type AccountsMinOrderByAggregateInput = {
    accountID?: SortOrder
    email?: SortOrder
    password?: SortOrder
    isVerified?: SortOrder
    createdAt?: SortOrder
    status?: SortOrder
  }

  export type AccountsSumOrderByAggregateInput = {
    accountID?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumprofileTypeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.profileType | EnumprofileTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumprofileTypeNullableFilter<$PrismaModel> | $Enums.profileType | null
  }

  export type Worker_ProfileNullableScalarRelationFilter = {
    is?: Worker_ProfileWhereInput | null
    isNot?: Worker_ProfileWhereInput | null
  }

  export type AccountsScalarRelationFilter = {
    is?: AccountsWhereInput
    isNot?: AccountsWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProfileCountOrderByAggregateInput = {
    profileID?: SortOrder
    accountID?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    contactNum?: SortOrder
    profileType?: SortOrder
  }

  export type ProfileAvgOrderByAggregateInput = {
    profileID?: SortOrder
    accountID?: SortOrder
  }

  export type ProfileMaxOrderByAggregateInput = {
    profileID?: SortOrder
    accountID?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    contactNum?: SortOrder
    profileType?: SortOrder
  }

  export type ProfileMinOrderByAggregateInput = {
    profileID?: SortOrder
    accountID?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    username?: SortOrder
    contactNum?: SortOrder
    profileType?: SortOrder
  }

  export type ProfileSumOrderByAggregateInput = {
    profileID?: SortOrder
    accountID?: SortOrder
  }

  export type EnumprofileTypeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.profileType | EnumprofileTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumprofileTypeNullableWithAggregatesFilter<$PrismaModel> | $Enums.profileType | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumprofileTypeNullableFilter<$PrismaModel>
    _max?: NestedEnumprofileTypeNullableFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type EnumavailabilityStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.availabilityStatus | EnumavailabilityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumavailabilityStatusFilter<$PrismaModel> | $Enums.availabilityStatus
  }

  export type ProfileNullableScalarRelationFilter = {
    is?: ProfileWhereInput | null
    isNot?: ProfileWhereInput | null
  }

  export type Freelancer_SpecializationListRelationFilter = {
    every?: Freelancer_SpecializationWhereInput
    some?: Freelancer_SpecializationWhereInput
    none?: Freelancer_SpecializationWhereInput
  }

  export type Freelancer_SpecializationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type Worker_ProfileCountOrderByAggregateInput = {
    profileID?: SortOrder
    profileImg?: SortOrder
    hourlyRate?: SortOrder
    verifiedSkills?: SortOrder
    responseTimeAvg?: SortOrder
    completionRate?: SortOrder
    bio?: SortOrder
    totalEarningGross?: SortOrder
    withholdingBalance?: SortOrder
    description?: SortOrder
    availabilityStatus?: SortOrder
  }

  export type Worker_ProfileAvgOrderByAggregateInput = {
    profileID?: SortOrder
    hourlyRate?: SortOrder
    responseTimeAvg?: SortOrder
    completionRate?: SortOrder
    totalEarningGross?: SortOrder
    withholdingBalance?: SortOrder
  }

  export type Worker_ProfileMaxOrderByAggregateInput = {
    profileID?: SortOrder
    profileImg?: SortOrder
    hourlyRate?: SortOrder
    responseTimeAvg?: SortOrder
    completionRate?: SortOrder
    bio?: SortOrder
    totalEarningGross?: SortOrder
    withholdingBalance?: SortOrder
    description?: SortOrder
    availabilityStatus?: SortOrder
  }

  export type Worker_ProfileMinOrderByAggregateInput = {
    profileID?: SortOrder
    profileImg?: SortOrder
    hourlyRate?: SortOrder
    responseTimeAvg?: SortOrder
    completionRate?: SortOrder
    bio?: SortOrder
    totalEarningGross?: SortOrder
    withholdingBalance?: SortOrder
    description?: SortOrder
    availabilityStatus?: SortOrder
  }

  export type Worker_ProfileSumOrderByAggregateInput = {
    profileID?: SortOrder
    hourlyRate?: SortOrder
    responseTimeAvg?: SortOrder
    completionRate?: SortOrder
    totalEarningGross?: SortOrder
    withholdingBalance?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type EnumavailabilityStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.availabilityStatus | EnumavailabilityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumavailabilityStatusWithAggregatesFilter<$PrismaModel> | $Enums.availabilityStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumavailabilityStatusFilter<$PrismaModel>
    _max?: NestedEnumavailabilityStatusFilter<$PrismaModel>
  }

  export type Worker_ProfileScalarRelationFilter = {
    is?: Worker_ProfileWhereInput
    isNot?: Worker_ProfileWhereInput
  }

  export type SpecializationScalarRelationFilter = {
    is?: SpecializationWhereInput
    isNot?: SpecializationWhereInput
  }

  export type Freelancer_SpecializationWorkerIDSpecializationIDCompoundUniqueInput = {
    workerID: number
    specializationID: number
  }

  export type Freelancer_SpecializationCountOrderByAggregateInput = {
    workerID?: SortOrder
    specializationID?: SortOrder
    experienceYears?: SortOrder
    certification?: SortOrder
  }

  export type Freelancer_SpecializationAvgOrderByAggregateInput = {
    workerID?: SortOrder
    specializationID?: SortOrder
    experienceYears?: SortOrder
  }

  export type Freelancer_SpecializationMaxOrderByAggregateInput = {
    workerID?: SortOrder
    specializationID?: SortOrder
    experienceYears?: SortOrder
    certification?: SortOrder
  }

  export type Freelancer_SpecializationMinOrderByAggregateInput = {
    workerID?: SortOrder
    specializationID?: SortOrder
    experienceYears?: SortOrder
    certification?: SortOrder
  }

  export type Freelancer_SpecializationSumOrderByAggregateInput = {
    workerID?: SortOrder
    specializationID?: SortOrder
    experienceYears?: SortOrder
  }

  export type SpecializationCountOrderByAggregateInput = {
    specializationID?: SortOrder
    specializationName?: SortOrder
  }

  export type SpecializationAvgOrderByAggregateInput = {
    specializationID?: SortOrder
  }

  export type SpecializationMaxOrderByAggregateInput = {
    specializationID?: SortOrder
    specializationName?: SortOrder
  }

  export type SpecializationMinOrderByAggregateInput = {
    specializationID?: SortOrder
    specializationName?: SortOrder
  }

  export type SpecializationSumOrderByAggregateInput = {
    specializationID?: SortOrder
  }

  export type ProfileCreateNestedManyWithoutAccountsInput = {
    create?: XOR<ProfileCreateWithoutAccountsInput, ProfileUncheckedCreateWithoutAccountsInput> | ProfileCreateWithoutAccountsInput[] | ProfileUncheckedCreateWithoutAccountsInput[]
    connectOrCreate?: ProfileCreateOrConnectWithoutAccountsInput | ProfileCreateOrConnectWithoutAccountsInput[]
    createMany?: ProfileCreateManyAccountsInputEnvelope
    connect?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
  }

  export type ProfileUncheckedCreateNestedManyWithoutAccountsInput = {
    create?: XOR<ProfileCreateWithoutAccountsInput, ProfileUncheckedCreateWithoutAccountsInput> | ProfileCreateWithoutAccountsInput[] | ProfileUncheckedCreateWithoutAccountsInput[]
    connectOrCreate?: ProfileCreateOrConnectWithoutAccountsInput | ProfileCreateOrConnectWithoutAccountsInput[]
    createMany?: ProfileCreateManyAccountsInputEnvelope
    connect?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ProfileUpdateManyWithoutAccountsNestedInput = {
    create?: XOR<ProfileCreateWithoutAccountsInput, ProfileUncheckedCreateWithoutAccountsInput> | ProfileCreateWithoutAccountsInput[] | ProfileUncheckedCreateWithoutAccountsInput[]
    connectOrCreate?: ProfileCreateOrConnectWithoutAccountsInput | ProfileCreateOrConnectWithoutAccountsInput[]
    upsert?: ProfileUpsertWithWhereUniqueWithoutAccountsInput | ProfileUpsertWithWhereUniqueWithoutAccountsInput[]
    createMany?: ProfileCreateManyAccountsInputEnvelope
    set?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    disconnect?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    delete?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    connect?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    update?: ProfileUpdateWithWhereUniqueWithoutAccountsInput | ProfileUpdateWithWhereUniqueWithoutAccountsInput[]
    updateMany?: ProfileUpdateManyWithWhereWithoutAccountsInput | ProfileUpdateManyWithWhereWithoutAccountsInput[]
    deleteMany?: ProfileScalarWhereInput | ProfileScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ProfileUncheckedUpdateManyWithoutAccountsNestedInput = {
    create?: XOR<ProfileCreateWithoutAccountsInput, ProfileUncheckedCreateWithoutAccountsInput> | ProfileCreateWithoutAccountsInput[] | ProfileUncheckedCreateWithoutAccountsInput[]
    connectOrCreate?: ProfileCreateOrConnectWithoutAccountsInput | ProfileCreateOrConnectWithoutAccountsInput[]
    upsert?: ProfileUpsertWithWhereUniqueWithoutAccountsInput | ProfileUpsertWithWhereUniqueWithoutAccountsInput[]
    createMany?: ProfileCreateManyAccountsInputEnvelope
    set?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    disconnect?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    delete?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    connect?: ProfileWhereUniqueInput | ProfileWhereUniqueInput[]
    update?: ProfileUpdateWithWhereUniqueWithoutAccountsInput | ProfileUpdateWithWhereUniqueWithoutAccountsInput[]
    updateMany?: ProfileUpdateManyWithWhereWithoutAccountsInput | ProfileUpdateManyWithWhereWithoutAccountsInput[]
    deleteMany?: ProfileScalarWhereInput | ProfileScalarWhereInput[]
  }

  export type Worker_ProfileCreateNestedOneWithoutProfileInput = {
    create?: XOR<Worker_ProfileCreateWithoutProfileInput, Worker_ProfileUncheckedCreateWithoutProfileInput>
    connectOrCreate?: Worker_ProfileCreateOrConnectWithoutProfileInput
    connect?: Worker_ProfileWhereUniqueInput
  }

  export type AccountsCreateNestedOneWithoutProfileInput = {
    create?: XOR<AccountsCreateWithoutProfileInput, AccountsUncheckedCreateWithoutProfileInput>
    connectOrCreate?: AccountsCreateOrConnectWithoutProfileInput
    connect?: AccountsWhereUniqueInput
  }

  export type Worker_ProfileUncheckedCreateNestedOneWithoutProfileInput = {
    create?: XOR<Worker_ProfileCreateWithoutProfileInput, Worker_ProfileUncheckedCreateWithoutProfileInput>
    connectOrCreate?: Worker_ProfileCreateOrConnectWithoutProfileInput
    connect?: Worker_ProfileWhereUniqueInput
  }

  export type NullableEnumprofileTypeFieldUpdateOperationsInput = {
    set?: $Enums.profileType | null
  }

  export type Worker_ProfileUpdateOneWithoutProfileNestedInput = {
    create?: XOR<Worker_ProfileCreateWithoutProfileInput, Worker_ProfileUncheckedCreateWithoutProfileInput>
    connectOrCreate?: Worker_ProfileCreateOrConnectWithoutProfileInput
    upsert?: Worker_ProfileUpsertWithoutProfileInput
    disconnect?: Worker_ProfileWhereInput | boolean
    delete?: Worker_ProfileWhereInput | boolean
    connect?: Worker_ProfileWhereUniqueInput
    update?: XOR<XOR<Worker_ProfileUpdateToOneWithWhereWithoutProfileInput, Worker_ProfileUpdateWithoutProfileInput>, Worker_ProfileUncheckedUpdateWithoutProfileInput>
  }

  export type AccountsUpdateOneRequiredWithoutProfileNestedInput = {
    create?: XOR<AccountsCreateWithoutProfileInput, AccountsUncheckedCreateWithoutProfileInput>
    connectOrCreate?: AccountsCreateOrConnectWithoutProfileInput
    upsert?: AccountsUpsertWithoutProfileInput
    connect?: AccountsWhereUniqueInput
    update?: XOR<XOR<AccountsUpdateToOneWithWhereWithoutProfileInput, AccountsUpdateWithoutProfileInput>, AccountsUncheckedUpdateWithoutProfileInput>
  }

  export type Worker_ProfileUncheckedUpdateOneWithoutProfileNestedInput = {
    create?: XOR<Worker_ProfileCreateWithoutProfileInput, Worker_ProfileUncheckedCreateWithoutProfileInput>
    connectOrCreate?: Worker_ProfileCreateOrConnectWithoutProfileInput
    upsert?: Worker_ProfileUpsertWithoutProfileInput
    disconnect?: Worker_ProfileWhereInput | boolean
    delete?: Worker_ProfileWhereInput | boolean
    connect?: Worker_ProfileWhereUniqueInput
    update?: XOR<XOR<Worker_ProfileUpdateToOneWithWhereWithoutProfileInput, Worker_ProfileUpdateWithoutProfileInput>, Worker_ProfileUncheckedUpdateWithoutProfileInput>
  }

  export type ProfileCreateNestedOneWithoutWorkerInput = {
    create?: XOR<ProfileCreateWithoutWorkerInput, ProfileUncheckedCreateWithoutWorkerInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutWorkerInput
    connect?: ProfileWhereUniqueInput
  }

  export type Freelancer_SpecializationCreateNestedManyWithoutWorker_profileInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput> | Freelancer_SpecializationCreateWithoutWorker_profileInput[] | Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput | Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput[]
    createMany?: Freelancer_SpecializationCreateManyWorker_profileInputEnvelope
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
  }

  export type Freelancer_SpecializationUncheckedCreateNestedManyWithoutWorker_profileInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput> | Freelancer_SpecializationCreateWithoutWorker_profileInput[] | Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput | Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput[]
    createMany?: Freelancer_SpecializationCreateManyWorker_profileInputEnvelope
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type EnumavailabilityStatusFieldUpdateOperationsInput = {
    set?: $Enums.availabilityStatus
  }

  export type ProfileUpdateOneWithoutWorkerNestedInput = {
    create?: XOR<ProfileCreateWithoutWorkerInput, ProfileUncheckedCreateWithoutWorkerInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutWorkerInput
    upsert?: ProfileUpsertWithoutWorkerInput
    disconnect?: ProfileWhereInput | boolean
    delete?: ProfileWhereInput | boolean
    connect?: ProfileWhereUniqueInput
    update?: XOR<XOR<ProfileUpdateToOneWithWhereWithoutWorkerInput, ProfileUpdateWithoutWorkerInput>, ProfileUncheckedUpdateWithoutWorkerInput>
  }

  export type Freelancer_SpecializationUpdateManyWithoutWorker_profileNestedInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput> | Freelancer_SpecializationCreateWithoutWorker_profileInput[] | Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput | Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput[]
    upsert?: Freelancer_SpecializationUpsertWithWhereUniqueWithoutWorker_profileInput | Freelancer_SpecializationUpsertWithWhereUniqueWithoutWorker_profileInput[]
    createMany?: Freelancer_SpecializationCreateManyWorker_profileInputEnvelope
    set?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    disconnect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    delete?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    update?: Freelancer_SpecializationUpdateWithWhereUniqueWithoutWorker_profileInput | Freelancer_SpecializationUpdateWithWhereUniqueWithoutWorker_profileInput[]
    updateMany?: Freelancer_SpecializationUpdateManyWithWhereWithoutWorker_profileInput | Freelancer_SpecializationUpdateManyWithWhereWithoutWorker_profileInput[]
    deleteMany?: Freelancer_SpecializationScalarWhereInput | Freelancer_SpecializationScalarWhereInput[]
  }

  export type Freelancer_SpecializationUncheckedUpdateManyWithoutWorker_profileNestedInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput> | Freelancer_SpecializationCreateWithoutWorker_profileInput[] | Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput | Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput[]
    upsert?: Freelancer_SpecializationUpsertWithWhereUniqueWithoutWorker_profileInput | Freelancer_SpecializationUpsertWithWhereUniqueWithoutWorker_profileInput[]
    createMany?: Freelancer_SpecializationCreateManyWorker_profileInputEnvelope
    set?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    disconnect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    delete?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    update?: Freelancer_SpecializationUpdateWithWhereUniqueWithoutWorker_profileInput | Freelancer_SpecializationUpdateWithWhereUniqueWithoutWorker_profileInput[]
    updateMany?: Freelancer_SpecializationUpdateManyWithWhereWithoutWorker_profileInput | Freelancer_SpecializationUpdateManyWithWhereWithoutWorker_profileInput[]
    deleteMany?: Freelancer_SpecializationScalarWhereInput | Freelancer_SpecializationScalarWhereInput[]
  }

  export type Worker_ProfileCreateNestedOneWithoutFreelancer_specializationInput = {
    create?: XOR<Worker_ProfileCreateWithoutFreelancer_specializationInput, Worker_ProfileUncheckedCreateWithoutFreelancer_specializationInput>
    connectOrCreate?: Worker_ProfileCreateOrConnectWithoutFreelancer_specializationInput
    connect?: Worker_ProfileWhereUniqueInput
  }

  export type SpecializationCreateNestedOneWithoutFreelancer_specializationInput = {
    create?: XOR<SpecializationCreateWithoutFreelancer_specializationInput, SpecializationUncheckedCreateWithoutFreelancer_specializationInput>
    connectOrCreate?: SpecializationCreateOrConnectWithoutFreelancer_specializationInput
    connect?: SpecializationWhereUniqueInput
  }

  export type Worker_ProfileUpdateOneRequiredWithoutFreelancer_specializationNestedInput = {
    create?: XOR<Worker_ProfileCreateWithoutFreelancer_specializationInput, Worker_ProfileUncheckedCreateWithoutFreelancer_specializationInput>
    connectOrCreate?: Worker_ProfileCreateOrConnectWithoutFreelancer_specializationInput
    upsert?: Worker_ProfileUpsertWithoutFreelancer_specializationInput
    connect?: Worker_ProfileWhereUniqueInput
    update?: XOR<XOR<Worker_ProfileUpdateToOneWithWhereWithoutFreelancer_specializationInput, Worker_ProfileUpdateWithoutFreelancer_specializationInput>, Worker_ProfileUncheckedUpdateWithoutFreelancer_specializationInput>
  }

  export type SpecializationUpdateOneRequiredWithoutFreelancer_specializationNestedInput = {
    create?: XOR<SpecializationCreateWithoutFreelancer_specializationInput, SpecializationUncheckedCreateWithoutFreelancer_specializationInput>
    connectOrCreate?: SpecializationCreateOrConnectWithoutFreelancer_specializationInput
    upsert?: SpecializationUpsertWithoutFreelancer_specializationInput
    connect?: SpecializationWhereUniqueInput
    update?: XOR<XOR<SpecializationUpdateToOneWithWhereWithoutFreelancer_specializationInput, SpecializationUpdateWithoutFreelancer_specializationInput>, SpecializationUncheckedUpdateWithoutFreelancer_specializationInput>
  }

  export type Freelancer_SpecializationCreateNestedManyWithoutSpecializationInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutSpecializationInput, Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput> | Freelancer_SpecializationCreateWithoutSpecializationInput[] | Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput | Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput[]
    createMany?: Freelancer_SpecializationCreateManySpecializationInputEnvelope
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
  }

  export type Freelancer_SpecializationUncheckedCreateNestedManyWithoutSpecializationInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutSpecializationInput, Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput> | Freelancer_SpecializationCreateWithoutSpecializationInput[] | Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput | Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput[]
    createMany?: Freelancer_SpecializationCreateManySpecializationInputEnvelope
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
  }

  export type Freelancer_SpecializationUpdateManyWithoutSpecializationNestedInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutSpecializationInput, Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput> | Freelancer_SpecializationCreateWithoutSpecializationInput[] | Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput | Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput[]
    upsert?: Freelancer_SpecializationUpsertWithWhereUniqueWithoutSpecializationInput | Freelancer_SpecializationUpsertWithWhereUniqueWithoutSpecializationInput[]
    createMany?: Freelancer_SpecializationCreateManySpecializationInputEnvelope
    set?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    disconnect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    delete?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    update?: Freelancer_SpecializationUpdateWithWhereUniqueWithoutSpecializationInput | Freelancer_SpecializationUpdateWithWhereUniqueWithoutSpecializationInput[]
    updateMany?: Freelancer_SpecializationUpdateManyWithWhereWithoutSpecializationInput | Freelancer_SpecializationUpdateManyWithWhereWithoutSpecializationInput[]
    deleteMany?: Freelancer_SpecializationScalarWhereInput | Freelancer_SpecializationScalarWhereInput[]
  }

  export type Freelancer_SpecializationUncheckedUpdateManyWithoutSpecializationNestedInput = {
    create?: XOR<Freelancer_SpecializationCreateWithoutSpecializationInput, Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput> | Freelancer_SpecializationCreateWithoutSpecializationInput[] | Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput[]
    connectOrCreate?: Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput | Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput[]
    upsert?: Freelancer_SpecializationUpsertWithWhereUniqueWithoutSpecializationInput | Freelancer_SpecializationUpsertWithWhereUniqueWithoutSpecializationInput[]
    createMany?: Freelancer_SpecializationCreateManySpecializationInputEnvelope
    set?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    disconnect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    delete?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    connect?: Freelancer_SpecializationWhereUniqueInput | Freelancer_SpecializationWhereUniqueInput[]
    update?: Freelancer_SpecializationUpdateWithWhereUniqueWithoutSpecializationInput | Freelancer_SpecializationUpdateWithWhereUniqueWithoutSpecializationInput[]
    updateMany?: Freelancer_SpecializationUpdateManyWithWhereWithoutSpecializationInput | Freelancer_SpecializationUpdateManyWithWhereWithoutSpecializationInput[]
    deleteMany?: Freelancer_SpecializationScalarWhereInput | Freelancer_SpecializationScalarWhereInput[]
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumprofileTypeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.profileType | EnumprofileTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumprofileTypeNullableFilter<$PrismaModel> | $Enums.profileType | null
  }

  export type NestedEnumprofileTypeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.profileType | EnumprofileTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.profileType[] | ListEnumprofileTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumprofileTypeNullableWithAggregatesFilter<$PrismaModel> | $Enums.profileType | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumprofileTypeNullableFilter<$PrismaModel>
    _max?: NestedEnumprofileTypeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedEnumavailabilityStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.availabilityStatus | EnumavailabilityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumavailabilityStatusFilter<$PrismaModel> | $Enums.availabilityStatus
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumavailabilityStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.availabilityStatus | EnumavailabilityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.availabilityStatus[] | ListEnumavailabilityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumavailabilityStatusWithAggregatesFilter<$PrismaModel> | $Enums.availabilityStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumavailabilityStatusFilter<$PrismaModel>
    _max?: NestedEnumavailabilityStatusFilter<$PrismaModel>
  }

  export type ProfileCreateWithoutAccountsInput = {
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
    worker?: Worker_ProfileCreateNestedOneWithoutProfileInput
  }

  export type ProfileUncheckedCreateWithoutAccountsInput = {
    profileID?: number
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
    worker?: Worker_ProfileUncheckedCreateNestedOneWithoutProfileInput
  }

  export type ProfileCreateOrConnectWithoutAccountsInput = {
    where: ProfileWhereUniqueInput
    create: XOR<ProfileCreateWithoutAccountsInput, ProfileUncheckedCreateWithoutAccountsInput>
  }

  export type ProfileCreateManyAccountsInputEnvelope = {
    data: ProfileCreateManyAccountsInput | ProfileCreateManyAccountsInput[]
    skipDuplicates?: boolean
  }

  export type ProfileUpsertWithWhereUniqueWithoutAccountsInput = {
    where: ProfileWhereUniqueInput
    update: XOR<ProfileUpdateWithoutAccountsInput, ProfileUncheckedUpdateWithoutAccountsInput>
    create: XOR<ProfileCreateWithoutAccountsInput, ProfileUncheckedCreateWithoutAccountsInput>
  }

  export type ProfileUpdateWithWhereUniqueWithoutAccountsInput = {
    where: ProfileWhereUniqueInput
    data: XOR<ProfileUpdateWithoutAccountsInput, ProfileUncheckedUpdateWithoutAccountsInput>
  }

  export type ProfileUpdateManyWithWhereWithoutAccountsInput = {
    where: ProfileScalarWhereInput
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyWithoutAccountsInput>
  }

  export type ProfileScalarWhereInput = {
    AND?: ProfileScalarWhereInput | ProfileScalarWhereInput[]
    OR?: ProfileScalarWhereInput[]
    NOT?: ProfileScalarWhereInput | ProfileScalarWhereInput[]
    profileID?: IntFilter<"Profile"> | number
    accountID?: IntFilter<"Profile"> | number
    firstName?: StringFilter<"Profile"> | string
    lastName?: StringFilter<"Profile"> | string
    username?: StringFilter<"Profile"> | string
    contactNum?: StringFilter<"Profile"> | string
    profileType?: EnumprofileTypeNullableFilter<"Profile"> | $Enums.profileType | null
  }

  export type Worker_ProfileCreateWithoutProfileInput = {
    profileImg?: string | null
    hourlyRate: Decimal | DecimalJsLike | number | string
    verifiedSkills: JsonNullValueInput | InputJsonValue
    responseTimeAvg: Decimal | DecimalJsLike | number | string
    completionRate: Decimal | DecimalJsLike | number | string
    bio: string
    totalEarningGross: Decimal | DecimalJsLike | number | string
    withholdingBalance: Decimal | DecimalJsLike | number | string
    description: string
    availabilityStatus?: $Enums.availabilityStatus
    freelancer_specialization?: Freelancer_SpecializationCreateNestedManyWithoutWorker_profileInput
  }

  export type Worker_ProfileUncheckedCreateWithoutProfileInput = {
    profileImg?: string | null
    hourlyRate: Decimal | DecimalJsLike | number | string
    verifiedSkills: JsonNullValueInput | InputJsonValue
    responseTimeAvg: Decimal | DecimalJsLike | number | string
    completionRate: Decimal | DecimalJsLike | number | string
    bio: string
    totalEarningGross: Decimal | DecimalJsLike | number | string
    withholdingBalance: Decimal | DecimalJsLike | number | string
    description: string
    availabilityStatus?: $Enums.availabilityStatus
    freelancer_specialization?: Freelancer_SpecializationUncheckedCreateNestedManyWithoutWorker_profileInput
  }

  export type Worker_ProfileCreateOrConnectWithoutProfileInput = {
    where: Worker_ProfileWhereUniqueInput
    create: XOR<Worker_ProfileCreateWithoutProfileInput, Worker_ProfileUncheckedCreateWithoutProfileInput>
  }

  export type AccountsCreateWithoutProfileInput = {
    email: string
    password: string
    isVerified: boolean
    createdAt: Date | string
    status: string
  }

  export type AccountsUncheckedCreateWithoutProfileInput = {
    accountID?: number
    email: string
    password: string
    isVerified: boolean
    createdAt: Date | string
    status: string
  }

  export type AccountsCreateOrConnectWithoutProfileInput = {
    where: AccountsWhereUniqueInput
    create: XOR<AccountsCreateWithoutProfileInput, AccountsUncheckedCreateWithoutProfileInput>
  }

  export type Worker_ProfileUpsertWithoutProfileInput = {
    update: XOR<Worker_ProfileUpdateWithoutProfileInput, Worker_ProfileUncheckedUpdateWithoutProfileInput>
    create: XOR<Worker_ProfileCreateWithoutProfileInput, Worker_ProfileUncheckedCreateWithoutProfileInput>
    where?: Worker_ProfileWhereInput
  }

  export type Worker_ProfileUpdateToOneWithWhereWithoutProfileInput = {
    where?: Worker_ProfileWhereInput
    data: XOR<Worker_ProfileUpdateWithoutProfileInput, Worker_ProfileUncheckedUpdateWithoutProfileInput>
  }

  export type Worker_ProfileUpdateWithoutProfileInput = {
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
    freelancer_specialization?: Freelancer_SpecializationUpdateManyWithoutWorker_profileNestedInput
  }

  export type Worker_ProfileUncheckedUpdateWithoutProfileInput = {
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
    freelancer_specialization?: Freelancer_SpecializationUncheckedUpdateManyWithoutWorker_profileNestedInput
  }

  export type AccountsUpsertWithoutProfileInput = {
    update: XOR<AccountsUpdateWithoutProfileInput, AccountsUncheckedUpdateWithoutProfileInput>
    create: XOR<AccountsCreateWithoutProfileInput, AccountsUncheckedCreateWithoutProfileInput>
    where?: AccountsWhereInput
  }

  export type AccountsUpdateToOneWithWhereWithoutProfileInput = {
    where?: AccountsWhereInput
    data: XOR<AccountsUpdateWithoutProfileInput, AccountsUncheckedUpdateWithoutProfileInput>
  }

  export type AccountsUpdateWithoutProfileInput = {
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
  }

  export type AccountsUncheckedUpdateWithoutProfileInput = {
    accountID?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
  }

  export type ProfileCreateWithoutWorkerInput = {
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
    accounts: AccountsCreateNestedOneWithoutProfileInput
  }

  export type ProfileUncheckedCreateWithoutWorkerInput = {
    profileID?: number
    accountID: number
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
  }

  export type ProfileCreateOrConnectWithoutWorkerInput = {
    where: ProfileWhereUniqueInput
    create: XOR<ProfileCreateWithoutWorkerInput, ProfileUncheckedCreateWithoutWorkerInput>
  }

  export type Freelancer_SpecializationCreateWithoutWorker_profileInput = {
    experienceYears: number
    certification: string
    specialization: SpecializationCreateNestedOneWithoutFreelancer_specializationInput
  }

  export type Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput = {
    specializationID: number
    experienceYears: number
    certification: string
  }

  export type Freelancer_SpecializationCreateOrConnectWithoutWorker_profileInput = {
    where: Freelancer_SpecializationWhereUniqueInput
    create: XOR<Freelancer_SpecializationCreateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput>
  }

  export type Freelancer_SpecializationCreateManyWorker_profileInputEnvelope = {
    data: Freelancer_SpecializationCreateManyWorker_profileInput | Freelancer_SpecializationCreateManyWorker_profileInput[]
    skipDuplicates?: boolean
  }

  export type ProfileUpsertWithoutWorkerInput = {
    update: XOR<ProfileUpdateWithoutWorkerInput, ProfileUncheckedUpdateWithoutWorkerInput>
    create: XOR<ProfileCreateWithoutWorkerInput, ProfileUncheckedCreateWithoutWorkerInput>
    where?: ProfileWhereInput
  }

  export type ProfileUpdateToOneWithWhereWithoutWorkerInput = {
    where?: ProfileWhereInput
    data: XOR<ProfileUpdateWithoutWorkerInput, ProfileUncheckedUpdateWithoutWorkerInput>
  }

  export type ProfileUpdateWithoutWorkerInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
    accounts?: AccountsUpdateOneRequiredWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateWithoutWorkerInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    accountID?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
  }

  export type Freelancer_SpecializationUpsertWithWhereUniqueWithoutWorker_profileInput = {
    where: Freelancer_SpecializationWhereUniqueInput
    update: XOR<Freelancer_SpecializationUpdateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedUpdateWithoutWorker_profileInput>
    create: XOR<Freelancer_SpecializationCreateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedCreateWithoutWorker_profileInput>
  }

  export type Freelancer_SpecializationUpdateWithWhereUniqueWithoutWorker_profileInput = {
    where: Freelancer_SpecializationWhereUniqueInput
    data: XOR<Freelancer_SpecializationUpdateWithoutWorker_profileInput, Freelancer_SpecializationUncheckedUpdateWithoutWorker_profileInput>
  }

  export type Freelancer_SpecializationUpdateManyWithWhereWithoutWorker_profileInput = {
    where: Freelancer_SpecializationScalarWhereInput
    data: XOR<Freelancer_SpecializationUpdateManyMutationInput, Freelancer_SpecializationUncheckedUpdateManyWithoutWorker_profileInput>
  }

  export type Freelancer_SpecializationScalarWhereInput = {
    AND?: Freelancer_SpecializationScalarWhereInput | Freelancer_SpecializationScalarWhereInput[]
    OR?: Freelancer_SpecializationScalarWhereInput[]
    NOT?: Freelancer_SpecializationScalarWhereInput | Freelancer_SpecializationScalarWhereInput[]
    workerID?: IntFilter<"Freelancer_Specialization"> | number
    specializationID?: IntFilter<"Freelancer_Specialization"> | number
    experienceYears?: IntFilter<"Freelancer_Specialization"> | number
    certification?: StringFilter<"Freelancer_Specialization"> | string
  }

  export type Worker_ProfileCreateWithoutFreelancer_specializationInput = {
    profileImg?: string | null
    hourlyRate: Decimal | DecimalJsLike | number | string
    verifiedSkills: JsonNullValueInput | InputJsonValue
    responseTimeAvg: Decimal | DecimalJsLike | number | string
    completionRate: Decimal | DecimalJsLike | number | string
    bio: string
    totalEarningGross: Decimal | DecimalJsLike | number | string
    withholdingBalance: Decimal | DecimalJsLike | number | string
    description: string
    availabilityStatus?: $Enums.availabilityStatus
    profile?: ProfileCreateNestedOneWithoutWorkerInput
  }

  export type Worker_ProfileUncheckedCreateWithoutFreelancer_specializationInput = {
    profileID: number
    profileImg?: string | null
    hourlyRate: Decimal | DecimalJsLike | number | string
    verifiedSkills: JsonNullValueInput | InputJsonValue
    responseTimeAvg: Decimal | DecimalJsLike | number | string
    completionRate: Decimal | DecimalJsLike | number | string
    bio: string
    totalEarningGross: Decimal | DecimalJsLike | number | string
    withholdingBalance: Decimal | DecimalJsLike | number | string
    description: string
    availabilityStatus?: $Enums.availabilityStatus
  }

  export type Worker_ProfileCreateOrConnectWithoutFreelancer_specializationInput = {
    where: Worker_ProfileWhereUniqueInput
    create: XOR<Worker_ProfileCreateWithoutFreelancer_specializationInput, Worker_ProfileUncheckedCreateWithoutFreelancer_specializationInput>
  }

  export type SpecializationCreateWithoutFreelancer_specializationInput = {
    specializationName: string
  }

  export type SpecializationUncheckedCreateWithoutFreelancer_specializationInput = {
    specializationID?: number
    specializationName: string
  }

  export type SpecializationCreateOrConnectWithoutFreelancer_specializationInput = {
    where: SpecializationWhereUniqueInput
    create: XOR<SpecializationCreateWithoutFreelancer_specializationInput, SpecializationUncheckedCreateWithoutFreelancer_specializationInput>
  }

  export type Worker_ProfileUpsertWithoutFreelancer_specializationInput = {
    update: XOR<Worker_ProfileUpdateWithoutFreelancer_specializationInput, Worker_ProfileUncheckedUpdateWithoutFreelancer_specializationInput>
    create: XOR<Worker_ProfileCreateWithoutFreelancer_specializationInput, Worker_ProfileUncheckedCreateWithoutFreelancer_specializationInput>
    where?: Worker_ProfileWhereInput
  }

  export type Worker_ProfileUpdateToOneWithWhereWithoutFreelancer_specializationInput = {
    where?: Worker_ProfileWhereInput
    data: XOR<Worker_ProfileUpdateWithoutFreelancer_specializationInput, Worker_ProfileUncheckedUpdateWithoutFreelancer_specializationInput>
  }

  export type Worker_ProfileUpdateWithoutFreelancer_specializationInput = {
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
    profile?: ProfileUpdateOneWithoutWorkerNestedInput
  }

  export type Worker_ProfileUncheckedUpdateWithoutFreelancer_specializationInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    profileImg?: NullableStringFieldUpdateOperationsInput | string | null
    hourlyRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    verifiedSkills?: JsonNullValueInput | InputJsonValue
    responseTimeAvg?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    completionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    bio?: StringFieldUpdateOperationsInput | string
    totalEarningGross?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    withholdingBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    availabilityStatus?: EnumavailabilityStatusFieldUpdateOperationsInput | $Enums.availabilityStatus
  }

  export type SpecializationUpsertWithoutFreelancer_specializationInput = {
    update: XOR<SpecializationUpdateWithoutFreelancer_specializationInput, SpecializationUncheckedUpdateWithoutFreelancer_specializationInput>
    create: XOR<SpecializationCreateWithoutFreelancer_specializationInput, SpecializationUncheckedCreateWithoutFreelancer_specializationInput>
    where?: SpecializationWhereInput
  }

  export type SpecializationUpdateToOneWithWhereWithoutFreelancer_specializationInput = {
    where?: SpecializationWhereInput
    data: XOR<SpecializationUpdateWithoutFreelancer_specializationInput, SpecializationUncheckedUpdateWithoutFreelancer_specializationInput>
  }

  export type SpecializationUpdateWithoutFreelancer_specializationInput = {
    specializationName?: StringFieldUpdateOperationsInput | string
  }

  export type SpecializationUncheckedUpdateWithoutFreelancer_specializationInput = {
    specializationID?: IntFieldUpdateOperationsInput | number
    specializationName?: StringFieldUpdateOperationsInput | string
  }

  export type Freelancer_SpecializationCreateWithoutSpecializationInput = {
    experienceYears: number
    certification: string
    worker_profile: Worker_ProfileCreateNestedOneWithoutFreelancer_specializationInput
  }

  export type Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput = {
    workerID: number
    experienceYears: number
    certification: string
  }

  export type Freelancer_SpecializationCreateOrConnectWithoutSpecializationInput = {
    where: Freelancer_SpecializationWhereUniqueInput
    create: XOR<Freelancer_SpecializationCreateWithoutSpecializationInput, Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput>
  }

  export type Freelancer_SpecializationCreateManySpecializationInputEnvelope = {
    data: Freelancer_SpecializationCreateManySpecializationInput | Freelancer_SpecializationCreateManySpecializationInput[]
    skipDuplicates?: boolean
  }

  export type Freelancer_SpecializationUpsertWithWhereUniqueWithoutSpecializationInput = {
    where: Freelancer_SpecializationWhereUniqueInput
    update: XOR<Freelancer_SpecializationUpdateWithoutSpecializationInput, Freelancer_SpecializationUncheckedUpdateWithoutSpecializationInput>
    create: XOR<Freelancer_SpecializationCreateWithoutSpecializationInput, Freelancer_SpecializationUncheckedCreateWithoutSpecializationInput>
  }

  export type Freelancer_SpecializationUpdateWithWhereUniqueWithoutSpecializationInput = {
    where: Freelancer_SpecializationWhereUniqueInput
    data: XOR<Freelancer_SpecializationUpdateWithoutSpecializationInput, Freelancer_SpecializationUncheckedUpdateWithoutSpecializationInput>
  }

  export type Freelancer_SpecializationUpdateManyWithWhereWithoutSpecializationInput = {
    where: Freelancer_SpecializationScalarWhereInput
    data: XOR<Freelancer_SpecializationUpdateManyMutationInput, Freelancer_SpecializationUncheckedUpdateManyWithoutSpecializationInput>
  }

  export type ProfileCreateManyAccountsInput = {
    profileID?: number
    firstName: string
    lastName: string
    username: string
    contactNum: string
    profileType?: $Enums.profileType | null
  }

  export type ProfileUpdateWithoutAccountsInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
    worker?: Worker_ProfileUpdateOneWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateWithoutAccountsInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
    worker?: Worker_ProfileUncheckedUpdateOneWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateManyWithoutAccountsInput = {
    profileID?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    contactNum?: StringFieldUpdateOperationsInput | string
    profileType?: NullableEnumprofileTypeFieldUpdateOperationsInput | $Enums.profileType | null
  }

  export type Freelancer_SpecializationCreateManyWorker_profileInput = {
    specializationID: number
    experienceYears: number
    certification: string
  }

  export type Freelancer_SpecializationUpdateWithoutWorker_profileInput = {
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
    specialization?: SpecializationUpdateOneRequiredWithoutFreelancer_specializationNestedInput
  }

  export type Freelancer_SpecializationUncheckedUpdateWithoutWorker_profileInput = {
    specializationID?: IntFieldUpdateOperationsInput | number
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
  }

  export type Freelancer_SpecializationUncheckedUpdateManyWithoutWorker_profileInput = {
    specializationID?: IntFieldUpdateOperationsInput | number
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
  }

  export type Freelancer_SpecializationCreateManySpecializationInput = {
    workerID: number
    experienceYears: number
    certification: string
  }

  export type Freelancer_SpecializationUpdateWithoutSpecializationInput = {
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
    worker_profile?: Worker_ProfileUpdateOneRequiredWithoutFreelancer_specializationNestedInput
  }

  export type Freelancer_SpecializationUncheckedUpdateWithoutSpecializationInput = {
    workerID?: IntFieldUpdateOperationsInput | number
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
  }

  export type Freelancer_SpecializationUncheckedUpdateManyWithoutSpecializationInput = {
    workerID?: IntFieldUpdateOperationsInput | number
    experienceYears?: IntFieldUpdateOperationsInput | number
    certification?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}