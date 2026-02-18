# Connect to MCP Server

The connection to Mercado Pago MCP Server is done remotely through the client that best suits your integration. Check the step-by-step guide below according to the client type.

::::TabsComponent

:::TabComponent{title="Cursor"}
To install our MCP in Cursor, you can click the button below or follow the steps manually.

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=mcp-mercadopago-prod-oauth&config=eyJ1cmwiOiJodHRwczovL21jcC5tZXJjYWRvcGFnby5jb20vbWNwIn0%3D)

Open the `.cursor/mcp.json` file and add the Mercado Pago server configuration as shown below.

```json
{
  "mcpServers": {
    "mercadopago-mcp-server": {
      "url": "https://mcp.mercadopago.com/mcp"
    }
  }
}
```
Then, go to **Cursor Settings > Tools & MCPs** and enable Mercado Pago MCP Server by clicking **Connect**.

![Cursor Tools & MCP](https://http2.mlstatic.com/storage/dx-devsite/docs-assets/custom-upload/2025/11/5/1764949890252-cursormcp.png)

> WARNING
>
> If Cursor does not initiate the connection when clicking the indicated button, use the **Needs authentication** link, located below the MCP name. 

When enabling the connection, you will be redirected to the Mercado Pago website for authentication, where you must indicate which **country** you are operating from and, if you agree with the permissions granted, **authorize the connection**.

Once these steps are completed, you will automatically return to Cursor and the connection to Mercado Pago MCP Server will be ready.

![mcp-installation-en-gif](https://http2.mlstatic.com/storage/dx-devsite/docs-assets/custom-upload/2025/4/27/1748367067297-mcpsuccessconfigcursor.png)

:::
:::TabComponent{title="VS Code"}

Open VS Code and press **Cmnd + Shift + P** if you use macOS, or **Ctrl + Shift + P** if you use Windows. This will position you in the search bar, located at the top margin, so you can search in your settings.

Type **MCP: Add Server** and select that option. You will be asked for the following information:
 1. **Server type:** select the option **HTTP (HTTP or Server-Sent Events)**.
 2. **Server URL:** copy and paste the Mercado Pago MCP Server URL.

 ```plain
 "https://mcp.mercadopago.com/mcp"
 ```
 3. **Name** to identify the MCP: assign the one of your preference.

This will update the information contained in the `.vscode/mcp.json` file and, after a few seconds, will open a pop-up window requesting authorization to be redirected to the Mercado Pago URL for your authentication.

![VS Code redirect](https://http2.mlstatic.com/storage/dx-devsite/docs-assets/custom-upload/2025/11/5/1764949890455-vscoderedirect.png)

If this pop-up window does not appear automatically, you can click on **Start** within the same `.vscode/mcp.json` file.

There, you must indicate which **country** you are operating from and, if you agree with the permissions granted, **authorize the connection**.

Once these steps are completed, you will automatically return to VS Code and the connection to Mercado Pago MCP Server will be ready.
:::
:::TabComponent{title="Windsurf"}
You can install our MCP on Windsurf through the editor's _MCP Store_, or manually. Choose the option that best suits your needs.

### Installation via the MCP Store

Follow the steps below to install Mercado Pago MCP Server via the Windsurf Editor's MCP Store.

1. Access the **MCP Store** in the top right menu of the editor.
2. On the search screen, type "MercadoPago" to find our MCP Server.
4. Select the server and click **Install**.
5. In the pop-up window, enter the :toolTipComponent[Access Token]{content ="Private key of the application created in Mercado Pago and used in the backend. You can access it through *Your integrations* > *Application details* > *Tests* > *Test credentials* or *Production* > *Production credentials*." title="Access Token"} of the account you want to connect.
6. Save the configuration and wait for the result.

![MCP installation via Windsurf Store](https://http2.mlstatic.com/storage/dx-devsite/docs-assets/custom-upload/2025/7/7/1754573349844-Windsurfmcpstore.gif)

If the process was successful, you will see Mercado Pago MCP Server marked as **Enabled** and it will be ready to use. If it is still not enabled, you can click **Refresh** to update the configuration.

### Manual installation

If you want to manually install Mercado Pago MCP Server in Windsurf Editor, open the `mcp_config.json` file and add the Mercado Pago server configuration as shown below.

Make sure to complete the authorization field with your :toolTipComponent[Access Token]{content ="Private key of the application created in Mercado Pago and used in the backend. You can access it through *Your integrations* > *Application details* > *Tests* > *Test credentials* or *Production* > *Production credentials*." title="Access Token"}.

```json
{
  "mcpServers": {
    "mercadopago-mcp-server":{
      "serverUrl": "https://mcp.mercadopago.com/mcp",
      "headers": {
        "Authorization": "Bearer <ACCESS_TOKEN>"
      }
    }
  }
}
```

After completing these steps, Mercado Pago MCP Server will be ready to use. To verify if the integration was successful, access your client settings and confirm that the MCP is configured as available.

> WARNING
>
> If when checking your IDE client settings you don't find an associated MCP Server, verify that you have inserted the code correctly and click the refresh icon. Check the [Windsurf documentation](https://docs.codeium.com/windsurf/mcp) for more information.

:::
:::TabComponent{title="Other IDEs"}

> WARNING
>
> To configure our MCP Server using other IDEs, you must have NPM package version 6 or higher and NodeJS 20 or higher installed.

Open the IDE and look for the JSON file related to MCP servers. Then, complete the `authorization` fields with your :toolTipComponent[_Access Token_]{content ="Private key of the application created in Mercado Pago and used in the backend. You can access it through *Your integrations* > *Application details* > *Tests* > *Test credentials* or *Production* > *Production credentials*." title="Access Token"}.

Below, you can see an example of how to perform this configuration in **Cline**.

### Cline

Open the `cline_mcp_settings.json` file and add the Mercado Pago server configuration. Remember to complete the `authorization` field with your :toolTipComponent[_Access Token_]{content ="Private key of the application created in Mercado Pago and used in the backend. You can access it through *Your integrations* > *Application details* > *Tests* > *Test credentials* or *Production* > *Production credentials*." title="Access Token"}. 

If you need more information, visit the [Cline Desktop documentation](https://docs.cline.bot/enterprise-solutions/mcp-servers).

```Cline
{
  "mcpServers": {
    "mercadopago-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.mercadopago.com/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer <ACCESS_TOKEN>"
      }
    }
  }
}
```

After completing these steps, Mercado Pago MCP Server will be ready to use. To verify if the integration was successful, access your IDE client settings and confirm that the MCP is configured as available.

> WARNING
>
> If when checking your IDE client settings you don't find an associated MCP Server, verify that you have inserted the code correctly and click the refresh icon.

:::
:::TabComponent{title="Other clients"}
For clients that are not IDEs, the connection is made directly in the configuration panel.

> WARNING
>
> To configure our MCP Server using other clients, you must have NPM package version 6 or higher and NodeJS 20 or higher installed.

#### Claude Desktop
Open the `claude_desktop_config.json` file and add the Mercado Pago server configuration. Check the [Claude Desktop documentation](https://modelcontextprotocol.io/quickstart/user) for more information.

```json
{
  "mcpServers": {
    "mercadopago-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.mercadopago.com/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer <ACCESS_TOKEN>"
      }
    }
  }
}
```

#### Claude Code

To connect to Mercado Pago MCP Server from Claude Code, use the following command, making sure to include your :toolTipComponent[Access Token]{content ="Private key of the application created in Mercado Pago and used in the backend. You can access it through *Your integrations* > *Application details* > *Tests* > *Test credentials* or *Production* > *Production credentials*." title="Access Token"}.

```bash
claude mcp add \
  --transport http \
  mercadopago \
  https://mcp.mercadopago.com/mcp \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Then, if you want to verify the connection, run the following command. You should see Mercado Pago MCP Server listed.

```bash
claude mcp list
```

#### OpenAI
If you use the paid version of OpenAI, you can add Mercado Pago MCP Server among the available _tools_ in your _Playground_. Follow the steps below.

1. Go to the _Playground_ section, located in the upper right corner of the screen.
2. In the _Prompts_ section, select the addition icon (**+**) located next to _Tools_.
3. Then, click on **MCP Server**. A modal will open with MCP options to add. Select the **+ Add new** button.
4. Fill in the form fields with the MCP Server information:

```json
URL: https://mcp.mercadopago.com/mcp
Label: Mercado Pago MCP Server
Authentication:
Access Token/Public Key: "Bearer <ACCESS_TOKEN>"
```
5. Once it's done, the server will be connected. On the screen with MCP information, enable approval of _Tools_ calls and select the _Tool_ you want to use, for example `search-documentation`.
6. Finally, click **Add**.
7. Run a test call through ChatGPT.

See the example below:

![OpenAI example](https://http2.mlstatic.com/storage/dx-devsite/docs-assets/custom-upload/2025/4/27/1748353483238-openaiplatformconnect.gif)

:::

::::

## Test the connection

To test the connection to the MCP Server, you need to make a query with the assistant using any of the available _tools_.

For example, if you want to test the _tool_ `search-documentation`, you just need to execute the prompt indicating what information you want to search for:

[[[
```plain
Search in Mercado Pago's documentation how to integrate Checkout Pro.
```
]]]

![mcp-server](https://http2.mlstatic.com/storage/dx-devsite/docs-assets/custom-upload/2025/4/28/1748435421551-searchdocpromptenh.gif)
