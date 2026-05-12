# Nest.js Reference Manual (v11.1.19)

## Section 0: Quick Start

Immediate hands-on path for Nest.js development.

```bash
# Install CLI and scaffold project
npm i -g @nestjs/cli
nest new hello-nest --skip-git
cd hello-nest && npm run start
```

Visit `http://localhost:3000` → See "Hello World!" response.

---

## Section 1: Key Language Terms & Features

- **Modules** — Essential building blocks used to organize the application structure | `@Module({ controllers: [AppController], providers: [AppService] })` | ⚠️ Keep modules focused; avoid "God Modules" that import everything.
- **Controllers** — Classes responsible for handling incoming HTTP requests and returning responses | `@Controller('users') export class UsersController {}` | ⚠️ Keep logic minimal; delegate heavy lifting to Services.
- **Services/Providers** — Logic containers that can be injected as dependencies | `@Injectable() export class AppService {}` | ⚠️ Always use `@Injectable()` to make a class available for Nest's DI container.
- **Guards** — Determine whether a request should be handled by a route handler based on conditions (auth/roles) | `@UseGuards(AuthGuard)` | ⚠️ Prefer Guards over Middleware for authorization to access execution context.
- **Pipes** — Used for data transformation and validation before reaching the route handler | `@Body(new ValidationPipe())` | ⚠️ Use the built-in `ValidationPipe` with `class-validator` for robust DTO validation.
- **Interceptors** — Bind extra logic before or after method execution, transform results, or extend behavior | `@UseInterceptors(LoggingInterceptor)` | ⚠️ Ideal for global response wrapping or caching logic.
- **Exception Filters** — Custom logic to handle unhandled exceptions across the application | `@UseFilters(new HttpExceptionFilter())` | ⚠️ Use for standardized error response formats across the entire API.
- **Middleware** — Functions called before the route handler, similar to Express middleware | `consumer.apply(LoggerMiddleware).forRoutes('*')` | ⚠️ Middleware cannot access the Nest `ExecutionContext`. Use Interceptors/Guards if context is needed.
- **Decorators** — Declarative metadata used to define behavior for classes, methods, or parameters | `@Get(':id')`, `@Req()`, `@Param('id')` | ⚠️ Overusing custom decorators can make code harder to trace for new team members.
- **DTOs (Data Transfer Objects)** — Objects defining how data is sent over the network, used with Pipes for validation | `export class CreateUserDto { name: string; }` | ⚠️ Use classes instead of interfaces for DTOs to enable runtime validation via decorators.

---

## Section 2: Key Commands & Workflows

- `nest new <name>` — Scaffolds a new Nest.js project with standard boilerplate | _When starting a new application._
- `nest generate <schematic> <name>` — Generates a new element (module, controller, service, etc.) | _When adding features to an existing app._
- `nest start` — Starts the application in production mode | _When running the final build._
- `npm run start:dev` — Starts application with a watcher (HMR/restarts on change) | _Primary command during active development._
- `nest build` — Compiles the TypeScript code into a production-ready `/dist` folder | _Before deploying to a server._
- `nest info` — Displays information about the current Nest environment and dependencies | _When debugging version conflicts or setup issues._
- `npm run test` — Executes unit tests using Jest | _When verifying individual component logic._
- `npm run test:e2e` — Runs end-to-end tests for the entire application flow | _Before merging major feature updates._

---

## Section 3: Architecture & Component Relationships

Nest.js follows a modular, controller-service-provider architecture.

```text
HTTP Request
     ↓
[ Middleware ] (Optional: logging, body parsing)
     ↓
[ Guards ] (Authorization: Can this user access this?)
     ↓
[ Interceptors (Pre-handle) ] (Transforming request data)
     ↓
[ Pipes ] (Validation & Transformation: Is the data valid?)
     ↓
[ Controller ] (Route Handler: Map request to logic)
     ↓
[ Service/Provider ] (Business Logic: Process data, DB calls)
     ↓
[ Interceptors (Post-handle) ] (Transforming response data)
     ↓
[ Exception Filters ] (If error occurs: Standardize error output)
     ↓
HTTP Response
```

---

## Section 4: Documentation Links

- [Official Documentation](https://docs.nestjs.com/) — _Comprehensive guides for every feature._
- [API Reference](https://docs.nestjs.com/controllers) — _Detailed decorator and class definitions._
- [CLI Reference](https://docs.nestjs.com/cli/overview) — _Full list of commands and schematics._
- [NestJS GitHub](https://github.com/nestjs/nest) — _Source code, bug reports, and latest releases._
- [Ecosystem & Plugins](https://github.com/nestjs/nest/tree/master/sample) — _Official samples for Microservices, Websockets, GraphQL, etc._
