# Integración vía _Core Methods_ Web

En este método de integración, el responsable de la integración se encarga de definir cómo se buscará la información necesaria para completar el pago, a diferencia de la integración a través de Cardform, donde la búsqueda de la información se realiza de forma automática.

En la integración vía _Core Methods_, el integrador decide cuándo buscar información sobre el tipo de documento, además de la información de la tarjeta (emisor y cuotas). De esta forma, tiene total flexibilidad para construir la experiencia del flujo de pago.

> NOTE
>
> Importante
>
> Además de las opciones disponibles en esta documentación, también es posible integrar **pagos con tarjeta** utilizando el **Brick de CardPayment**. Consulta la documentación [Renderizado por defecto](/developers/es/docs/checkout-bricks/card-payment-brick/default-rendering#editor_2) de CardPayment para obtener más detalles.

Consulta el diagrama que ilustra el proceso de pago con tarjeta a través de los _Core Methods_.

![API-integration-flowchart](/images/api/api-integration-flowchart-coremethods-es.png)

## Importar MercadoPago.js

La primera etapa del proceso de integración de los pagos con tarjeta es la **captura de los datos de la tarjeta**. Esta captura se realiza a través de la inclusión de la biblioteca MercadoPago.js en tu proyecto, seguida del formulario de pago. Utiliza el siguiente código para importar la biblioteca MercadoPago.js antes de añadir el formulario de pago.

[[[
```html
<body>
  <script src="https://sdk.mercadopago.com/js/v2"></script>
</body>
```
```bash
npm install @mercadopago/sdk-js

```
]]]

> NOTE
>
> Importante
>
> La información de la tarjeta se convertirá en un token para enviar los datos a tus servidores de forma segura.

## Configurar credencial

Las credenciales son claves únicas con las que identificamos una integración en tu cuenta. Se utilizan para capturar pagos en tiendas online y otras aplicaciones de forma segura.

Esta es la primera etapa de una estructura de código completa que se debe seguir para integrar correctamente los pagos con tarjeta. Presta atención a los siguientes bloques para añadirlos a los códigos como se indica.

[[[
```html
<script>
  const mp = new MercadoPago("YOUR_PUBLIC_KEY");
</script>
```
```javascript
import { loadMercadoPago } from "@mercadopago/sdk-js";

await loadMercadoPago();
const mp = new window.MercadoPago("YOUR_PUBLIC_KEY");

```
]]]

## Añadir formulario de pago

La captura de los datos de la tarjeta (número de tarjeta, código de seguridad y fecha de expiración) se realiza a través de un formulario de pago que permite obtener y validar la información necesaria para procesar el pago.

Para obtener estos datos y procesar los pagos, inserta el siguiente HTML directamente en tu proyecto.

[[[
```html

  <style>
    #form-checkout {
      display: flex;
      flex-direction: column;
      max-width: 600px;
    }

    .container {
      height: 18px;
      display: inline-block;
      border: 1px solid rgb(118, 118, 118);
      border-radius: 2px;
      padding: 1px 2px;
    }
  </style>
  <form id="form-checkout" action="/process_payment" method="POST">
    <div id="form-checkout__cardNumber" class="container"></div>
    <div id="form-checkout__expirationDate" class="container"></div>
    <div id="form-checkout__securityCode" class="container"></div>
    <input type="text" id="form-checkout__cardholderName" placeholder="Titular de la tarjeta" />
    <select id="form-checkout__issuer" name="issuer">
      <option value="" disabled selected>Banco emisor</option>
    </select>
    <select id="form-checkout__installments" name="installments">
      <option value="" disabled selected>Cuotas</option>
    </select>
    <select id="form-checkout__identificationType" name="identificationType">
      <option value="" disabled selected>Tipo de documento</option>
    </select>
    <input type="text" id="form-checkout__identificationNumber" name="identificationNumber" placeholder="Número do documento" />
    <input type="email" id="form-checkout__email" name="email" placeholder="E-mail" />

    <input id="token" name="token" type="hidden">
    <input id="paymentMethodId" name="paymentMethodId" type="hidden">
    <input id="transactionAmount" name="transactionAmount" type="hidden" value="100">
    <input id="description" name="description" type="hidden" value="Nome do Produto">

    <button type="submit" id="form-checkout__submit">Pagar</button>
  </form>
```
]]]

## Inicializar campos de tarjeta

Después de añadir el formulario de pago, es necesario inicializar los campos de la tarjeta (número de tarjeta, fecha de expiración y código de seguridad) que deberán completarse al iniciar el flujo de pagos.

Una vez finalizada la inicialización de los campos, los divs contendrán los iframes con los inputs donde se insertarán los datos PCI.

[[[
```javascript

    const cardNumberElement = mp.fields.create('cardNumber', {
      placeholder: "Número de la tarjeta"
    }).mount('form-checkout__cardNumber');
    const expirationDateElement = mp.fields.create('expirationDate', {
      placeholder: "MM/YY",
    }).mount('form-checkout__expirationDate');
    const securityCodeElement = mp.fields.create('securityCode', {
      placeholder: "Código de seguridad"
    }).mount('form-checkout__securityCode');
```
]]]

## Obtener tipos de documentos

Después de configurar la credencial, añadir el formulario de pago y inicializar los campos de tarjeta, es necesario obtener los tipos de documentos que se utilizarán para rellenar el formulario de pago.

Al incluir el elemento del tipo `select` con el id: `form-checkout__identificationType`  que se encuentra en el formulario, será posible completar automáticamente las opciones disponibles al llamar la siguiente función.

[[[
```javascript

    (async function getIdentificationTypes() {
      try {
        const identificationTypes = await mp.getIdentificationTypes();
        const identificationTypeElement = document.getElementById('form-checkout__identificationType');

        createSelectOptions(identificationTypeElement, identificationTypes);
      } catch (e) {
        return console.error('Error getting identificationTypes: ', e);
      }
    })();

    function createSelectOptions(elem, options, labelsAndKeys = { label: "name", value: "id" }) {
      const { label, value } = labelsAndKeys;

      elem.options.length = 0;

      const tempOptions = document.createDocumentFragment();

      options.forEach(option => {
        const optValue = option[value];
        const optLabel = option[label];

        const opt = document.createElement('option');
        opt.value = optValue;
        opt.textContent = optLabel;

        tempOptions.appendChild(opt);
      });

      elem.appendChild(tempOptions);
    }
```
]]]

## Obtener métodos de pago de la tarjeta

En esta etapa se validan los datos de los compradores cuando rellenan los campos necesarios para realizar el pago. Para poder identificar el método de pago utilizado por el comprador, introduce el siguiente código directamente en tu proyecto. 

[[[
```javascript

    const paymentMethodElement = document.getElementById('paymentMethodId');
    const issuerElement = document.getElementById('form-checkout__issuer');
    const installmentsElement = document.getElementById('form-checkout__installments');

    const issuerPlaceholder = "Banco emisor";
    const installmentsPlaceholder = "Cuotas";

    let currentBin;
    cardNumberElement.on('binChange', async (data) => {
      const { bin } = data;
      try {
        if (!bin && paymentMethodElement.value) {
          clearSelectsAndSetPlaceholders();
          paymentMethodElement.value = "";
        }

        if (bin && bin !== currentBin) {
          const { results } = await mp.getPaymentMethods({ bin });
          const paymentMethod = results[0];

          paymentMethodElement.value = paymentMethod.id;
          updatePCIFieldsSettings(paymentMethod);
          updateIssuer(paymentMethod, bin);
          updateInstallments(paymentMethod, bin);
        }

        currentBin = bin;
      } catch (e) {
        console.error('error getting payment methods: ', e)
      }
    });

    function clearSelectsAndSetPlaceholders() {
      clearHTMLSelectChildrenFrom(issuerElement);
      createSelectElementPlaceholder(issuerElement, issuerPlaceholder);

      clearHTMLSelectChildrenFrom(installmentsElement);
      createSelectElementPlaceholder(installmentsElement, installmentsPlaceholder);
    }

    function clearHTMLSelectChildrenFrom(element) {
      const currOptions = [...element.children];
      currOptions.forEach(child => child.remove());
    }

    function createSelectElementPlaceholder(element, placeholder) {
      const optionElement = document.createElement('option');
      optionElement.textContent = placeholder;
      optionElement.setAttribute('selected', "");
      optionElement.setAttribute('disabled', "");

      element.appendChild(optionElement);
    }

    // Este paso mejora las validaciones de cardNumber y securityCode
    function updatePCIFieldsSettings(paymentMethod) {
      const { settings } = paymentMethod;

      const cardNumberSettings = settings[0].card_number;
      cardNumberElement.update({
        settings: cardNumberSettings
      });

      const securityCodeSettings = settings[0].security_code;
      securityCodeElement.update({
        settings: securityCodeSettings
      });
    }
```
]]]

## Obtener banco emisor

Al rellenar el formulario de pago, es posible identificar el banco emisor de la tarjeta, evitando conflictos de procesamiento de datos entre los diferentes emisores. Además, a partir de esta identificación se exhiben las opciones de pago en cuotas.

El banco emisor se obtiene a través del parámetro `issuer_id`. Para obtenerlo, utiliza el Javascript que se indica a continuación.

[[[
```javascript

    async function updateIssuer(paymentMethod, bin) {
      const { additional_info_needed, issuer } = paymentMethod;
      let issuerOptions = [issuer];

      if (additional_info_needed.includes('issuer_id')) {
        issuerOptions = await getIssuers(paymentMethod, bin);
      }

      createSelectOptions(issuerElement, issuerOptions);
    }

    async function getIssuers(paymentMethod, bin) {
      try {
        const { id: paymentMethodId } = paymentMethod;
        return await mp.getIssuers({ paymentMethodId, bin });
      } catch (e) {
        console.error('error getting issuers: ', e)
      }
    };
```
]]]

## Obtener cantidad de cuotas

Uno de los campos obligatorios que componen el formulario de pago es la **cantidad de cuotas**. Para activarlo y mostrar las cuotas disponibles a la hora de efectuar el pago, utiliza la siguiente función. 

[[[
```javascript

    async function updateInstallments(paymentMethod, bin) {
      try {
        const installments = await mp.getInstallments({
          amount: document.getElementById('transactionAmount').value,
          bin,
          paymentTypeId: 'credit_card'
        });
        const installmentOptions = installments[0].payer_costs;
        const installmentOptionsKeys = { label: 'recommended_message', value: 'installments' };
        createSelectOptions(installmentsElement, installmentOptions, installmentOptionsKeys);
      } catch (error) {
        console.error('error getting installments: ', e)
      }
    }
```
]]]

## Crear token de la tarjeta

El token de la tarjeta se crea a partir de la información de la misma, lo que aumenta la seguridad durante el flujo de pago. Además, después de que el token se utiliza en una compra determinada, este es descartado y se debe crear uno nuevo para futuras compras. Para crear el token de la tarjeta, utiliza la siguiente función.

> NOTE
>
> Importante
>
> El método `createCardToken` devuelve un token con la representación segura de los datos de la tarjeta. Tomaremos el ID del token de la respuesta y lo guardaremos en una input oculto denominado`token` para enviar posteriormente el formulario a los servidores. Además, ten en cuenta que el **token tiene una validez de 7 días** y solo se **puede usar una vez**.

[[[
```javascript

    const formElement = document.getElementById('form-checkout');
    formElement.addEventListener('submit', createCardToken);

    async function createCardToken(event) {
      try {
        const tokenElement = document.getElementById('token');
        if (!tokenElement.value) {
          event.preventDefault();
          const token = await mp.fields.createCardToken({
            cardholderName: document.getElementById('form-checkout__cardholderName').value,
            identificationType: document.getElementById('form-checkout__identificationType').value,
            identificationNumber: document.getElementById('form-checkout__identificationNumber').value,
          });
          tokenElement.value = token.id;
          formElement.requestSubmit();
        }
      } catch (e) {
        console.error('error creating card token: ', e)
      }
    }
```
]]]

## Enviar pago

Para finalizar el proceso de integración de pagos con tarjeta, es necesario que el backend reciba la información del formulario con el token generado y los datos completos como se indicó en las anteriores etapas.

Con toda la información recopilada en el backend, envíe un POST con los atributos necesarios, prestando atención a los parámetros `token, `transaction_amount`, `installments`, `payment_method_id` y `payer.email` al endpoint [/v1/payments](/developers/es/reference/payments/_payments/post) y ejecute la solicitud o, si lo prefieres, envía la información utilizando los SDKs que aparecen a continuación.

> NOTE
>
> Importante
>
> Para aumentar las posibilidades de aprobación del pago y evitar que el análisis antifraude no autorice la transacción, recomendamos introducir toda la información posible sobre el comprador al realizar la solicitud. Para más detalles sobre cómo aumentar las posibilidades de aprobación, consulta [Cómo mejorar la aprobación de los pagos](/developers/es/docs/checkout-api-payments/how-tos/improve-payment-approval).

[[[
```php
===
Encuentre el estado del pago en el campo _status_.
===
<?php
    require_once 'vendor/autoload.php';

    MercadoPago\SDK::setAccessToken("YOUR_ACCESS_TOKEN");

    $payment = new MercadoPago\Payment();
    $payment->transaction_amount = (float)$_POST['transactionAmount'];
    $payment->token = $_POST['token'];
    $payment->description = $_POST['description'];
    $payment->installments = (int)$_POST['installments'];
    $payment->payment_method_id = $_POST['paymentMethodId'];
    $payment->issuer_id = (int)$_POST['issuer'];

    $payer = new MercadoPago\Payer();
    $payer->email = $_POST['email'];
    $payer->identification = array(
        "type" => $_POST['identificationType'],
        "number" => $_POST['identificationNumber']
    );
    $payment->payer = $payer;

    $payment->save();

    $response = array(
        'status' => $payment->status,
        'status_detail' => $payment->status_detail,
        'id' => $payment->id
    );
    echo json_encode($response);

?>
```
```node
===
Encuentre el estado del pago en el campo _status_.
===

var mercadopago = require('mercadopago');
mercadopago.configurations.setAccessToken("YOUR_ACCESS_TOKEN");

var payment_data = {
  transaction_amount: Number(req.body.transactionAmount),
  token: req.body.token,
  description: req.body.description,
  installments: Number(req.body.installments),
  payment_method_id: req.body.paymentMethodId,
  issuer_id: req.body.issuer,
  payer: {
    email: req.body.email,
    identification: {
      type: req.body.identificationType,
      number: req.body.identificationNumber
    }
  }
};

mercadopago.payment.save(payment_data)
  .then(function(response) {
    res.status(response.status).json({
      status: response.body.status,
      status_detail: response.body.status_detail,
      id: response.body.id
    });
  })
  .catch(function(error) {
    console.error(error)
  });
```
```java
===
Encuentre el estado del pago en el campo _status_
===

MercadoPago.SDK.setAccessToken("YOUR_ACCESS_TOKEN");

Payment payment = new Payment();
payment.setTransactionAmount(Float.valueOf(request.getParameter("transactionAmount")))
       .setToken(request.getParameter("token"))
       .setDescription(request.getParameter("description"))
       .setInstallments(Integer.valueOf(request.getParameter("installments")))
       .setPaymentMethodId(request.getParameter("paymentMethodId"));

Identification identification = new Identification();
identification.setType(request.getParameter("identificationType"))
              .setNumber(request.getParameter("identificationNumber")); 

Payer payer = new Payer();
payer.setEmail(request.getParameter("email"))
     .setIdentification(identification);
     
payment.setPayer(payer);

payment.save();

System.out.println(payment.getStatus());

```
```ruby
===
Encuentre el estado del pago en el campo _status_
===
require 'mercadopago'
sdk = Mercadopago::SDK.new('YOUR_ACCESS_TOKEN')

payment_data = {
  transaction_amount: params[:transactionAmount].to_f,
  token: params[:token],
  description: params[:description],
  installments: params[:installments].to_i,
  payment_method_id: params[:paymentMethodId],
  payer: {
    email: params[:email],
    identification: {
      type: params[:identificationType],
      number: params[:identificationNumber]
    }
  }
}

payment_response = sdk.payment.create(payment_data)
payment = payment_response[:response]

puts payment

```
```csharp
===
Encuentre el estado del pago en el campo _status_
===
using System;
using MercadoPago.Client.Common;
using MercadoPago.Client.Payment;
using MercadoPago.Config;
using MercadoPago.Resource.Payment;

MercadoPagoConfig.AccessToken = "YOUR_ACCESS_TOKEN";

var paymentRequest = new PaymentCreateRequest
{
    TransactionAmount = decimal.Parse(Request["transactionAmount"]),
    Token = Request["token"],
    Description = Request["description"],
    Installments = int.Parse(Request["installments"]),
    PaymentMethodId = Request["paymentMethodId"],
    Payer = new PaymentPayerRequest
    {
        Email = Request["email"],
        Identification = new IdentificationRequest
        {
            Type = Request["identificationType"],
            Number = Request["identificationNumber"],
        },
    },
};

var client = new PaymentClient();
Payment payment = await client.CreateAsync(paymentRequest);

Console.WriteLine(payment.Status);

```
```python
===
Encuentre el estado del pago en el campo _status_
===
import mercadopago
sdk = mercadopago.SDK("ACCESS_TOKEN")

payment_data = {
    "transaction_amount": float(request.POST.get("transaction_amount")),
    "token": request.POST.get("token"),
    "description": request.POST.get("description"),
    "installments": int(request.POST.get("installments")),
    "payment_method_id": request.POST.get("payment_method_id"),
    "payer": {
        "email": request.POST.get("email"),
        "identification": {
            "type": request.POST.get("type"), 
            "number": request.POST.get("number")
        }
    }
}

payment_response = sdk.payment().create(payment_data)
payment = payment_response["response"]

print(payment)
```
```curl
===
Encuentre el estado del pago en el campo _status_
===

curl -X POST \
    -H 'accept: application/json' \
    -H 'content-type: application/json' \
    -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
    'https://api.mercadopago.com/v1/payments' \
    -d '{
          "transaction_amount": 100,
          "token": "ff8080814c11e237014c1ff593b57b4d",
          "description": "Blue shirt",
          "installments": 1,
          "payment_method_id": "visa",
          "issuer_id": 310,
          "payer": {
            "email": "test@test.com"
          }
    }'

```
]]]

> WARNING
>
> Importante
>
> Al crear un pago es posible recibir 3 estados diferentes: "Pendiente", "Rechazado" y "Aprobado". Para mantenerse al día con las actualizaciones, debe configurar su sistema para recibir notificaciones de pago y otras actualizaciones de estado. Consulte [Notificaciones](/developers/es/docs/checkout-api-payments/additional-content/your-integrations/notifications) para obtener más detalles.

Al finalizar, podrás realizar pruebas y asegurarte de que la integración funciona correctamente.



# Tipos de integración

La integración con   Checkout API  se puede realizar mediante diferentes procedimientos que varían en función de los conocimientos técnicos y las necesidades de negocio. La siguiente tabla detalla cada una de las opciones disponibles.

| Tipo de integración  | Medios de pago  | Complejidad a nível front-end | User interface (UI)  | 
| --- | --- | --- | --- | 
| [Checkout Bricks](/developers/es/docs/checkout-bricks/landing)  | Crédito, débito, Cuenta de Mercado Pago y Pago Efectivo. Vea más detalles en nuestra documentación [Medios de pago disponibles](/developers/es/docs/sales-processing/payment-methods).| Fácil | Componentes con UI predefinida y que puede ser personalizada si es necesario.  | 
| [Cardform](/developers/es/docs/checkout-api-payments/integration-configuration/card/web-integration)  | [Tarjeta](/developers/es/docs/sales-processing/payment-methods).  | Medio  | El formulario no posee ninguna estilización, lo que permite total flexibilidad en la personalización de la apariencia.  | 
|  [_Core Methods_ Web](/developers/es/docs/checkout-api-payments/integration-configuration/card/integrate-via-core-methods)  | [Tarjeta](/developers/es/docs/sales-processing/payment-methods).   | Alto | Crea tu propio formulario y sus estilos.  | 
|  [_Core Methods_ Mobile](/developers/es/docs/checkout-api-payments/integration-configuration/card/mobile-integration)  | [Tarjeta](/developers/es/docs/sales-processing/payment-methods).   | Alto | Crea tu propio formulario y sus estilos para aplicaciones móviles.  | 

Los tres tipos de integración mencionados anteriormente son elegibles para la **certificación PCI SAQ A**. Esto se debe a que los **datos de la tarjeta**, **CVV** y **fecha de vencimiento** viajan a través de un iframe directamente a los servidores de Mercado Pago, lo que evita que los datos PCI (número de tarjeta, código de seguridad y fecha de vencimiento) sean accesible a terceros.

Además de los medios de pago que se muestran en la tabla anterior, también es posible ofrecer otros métodos de pago. Para obtener una lista detallada de todas las opciones disponibles para la integración, envíe un **GET** al endpoint [/v1/payment_methods](/developers/es/reference/payment_methods/_payment_methods/get) y ejecute la solicitud. En la respuesta tendrás acceso a cada una de las opciones.



# Medios de pago disponibles

Puedes obtener una lista completa de los tipos y medios de pago disponibles, así como sus detalles (nombres, identificaciones, configuraciones, estado, etc.) a través de la API [Obtener métodos de pago](/developers/es/reference/payment_methods/_payment_methods/get). En la respuesta de esta API se indicará el medio de pago correspondiente al país asociado a tu cuenta de Mercado Pago.

| Medios de pago | 🇦🇷 <br> Argentina | 🇧🇷 <br> Brasil | 🇨🇱 <br> Chile | 🇨🇴 <br> Colombia | 🇲🇽 <br> México | 🇵🇪 <br> Perú | 🇺🇾 <br>Uruguay |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Dinero en Cuenta <br> `account_money` | Mercado Pago | Mercado Pago | Mercado Pago | Mercado Pago | Mercado Pago | Mercado Pago | Mercado Pago |
| ATM <br> `atm` |  -  | - | - | - | BBVA Bancomer <br> Citibanamex <br> Santander | PagoEfectivo | - |
| Transferencia Bancaria <br> `bank_transfer` | - | Pix | - | PSE | CLABE | Yape | - |
| Crédito <br> `credit_card` | Visa <br> Mastercard <br> American Express <br> Diners Club <br> Naranja <br> Cabal <br> Tarjeta Shopping <br> Cencosud <br> Argencard <br> CMR | Visa <br> Mastercard <br> American Express <br> Hipercard <br> Elo | Visa <br> Mastercard <br> American Express <br> Magna <br> Presto | Visa <br> Mastercard <br> American Express <br> Diners Club <br> Codensa | Visa <br> Mastercard <br> American Express | Visa <br> Diners Club <br> Mastercard <br> American Express | Visa <br> Mastercard <br> Oca <br> American Express <br> Creditel <br> Líder |
| Débito <br> `debit_card` | Visa <br> Mastercard <br> Maestro <br> Cabal | Tarjeta de débito virtual CAIXA* <br> Elo* | Visa <br> Mastercard <br> RedCompra | Visa <br> Mastercard | Visa <br> Mastercard | Visa <br> Mastercard | Visa |
| Tarjeta Prepago <br> `prepaid_card` | Visa <br> Mastercard  | Visa <br> Mastercard  | Visa <br> Mastercard  | Visa <br> Mastercard  | Visa <br> Mastercard <br> Mercado Pago   | Visa <br> Mastercard  | Visa <br> Mastercard  |
| Boleto/Efectivo <br> `ticket` | Rapipago* <br> Pago Fácil* | Boleto | - | Efecty | Oxxo <br> PayCash | - | Abitab <br> Red Pagos |
|   Cuotas sin Tarjeta   <br> `digital_currency`| Mercado Pago | Mercado Pago |  Mercado Pago | - | Mercado Pago | - | - |

_*Medios de pago no disponibles para Suscripciones._
