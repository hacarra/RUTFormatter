## Summary (English)

RUT Formatter PCF Control formats Chilean RUT strings inside Dataverse text columns, validates the dígito verificador, and outputs both the clean numeric value and a bound boolean flag so forms can enforce server-side rules. 

## Resumen (Español)

El control PCF RUT Formatter formatea los RUT chilenos en columnas de texto de Dataverse, valida el dígito verificador y expone tanto el valor limpio como un indicador booleano para aplicar reglas en los formularios. 

## Prerequisites

- Node.js 18+ and npm (for building/running the PCF project)
- [.NET SDK 6+](https://dotnet.microsoft.com/download) (provides `dotnet msbuild` for packaging the solution)
- [Power Platform CLI](https://learn.microsoft.com/power-platform/developer/cli/introduction) (`pac`) authenticated against the Dataverse environment where you will deploy

## Install dependencies

```pwsh
npm install
npm run refreshTypes
```

## Local development & testing

- **Live harness:**
  ```pwsh
  npm start
  ```
  Opens the PCF Test Harness at `http://localhost:8181`, letting you type sample RUTs, observe formatting, and watch the `rutIsValid` output toggle.

- **Watch mode (optional):**
  ```pwsh
  npm run start:watch
  ```
  Rebuilds automatically when source files change; refresh the harness browser tab to see updates.

## Build the control bundle

```pwsh
npm run build
```
Produces `out/controls/RUTFormatterControl/bundle.js`, which is what Dataverse consumes.

## Package the Dataverse solution

The repository already contains an unmanaged solution project under `solutions/RUTFormatter` referencing the PCF control.

```pwsh
Set-Location C:\sources\PCF\RUTFormater\solutions\RUTFormatter
# Restore once (downloads MSBuild targets)
dotnet msbuild RUTFormatter.cdsproj /t:restore
# Build whenever you need a fresh zip
dotnet msbuild RUTFormatter.cdsproj /t:build
Set-Location C:\sources\PCF\RUTFormater
```

The build creates `solutions/RUTFormatter/bin/Debug/RUTFormatter.zip` (unmanaged). For a managed variant, append ` /p:SolutionPackagerType=Managed` to the build command.

## Import into Dataverse

```pwsh
# run once per machine to store credentials
pac auth create --url https://<org>.crm.dynamics.com

# import the unmanaged solution
pac solution import --path .\solutions\RUTFormatter\bin\Debug\RUTFormatter.zip --async
```
Monitor the import from Power Platform Admin Center or with `pac solution list`. Publish customizations after the import completes.

## Binding inside a form

1. Add the control to a single line of text column bound to `rutValue`.
2. Map the `rutIsValid` output to a Two Options column if you want a server-side rule (e.g., prevent saving when invalid).
3. Publish the form; the control formats any incoming value, validates the dígito verificador, and saves the unformatted digits to Dataverse.
