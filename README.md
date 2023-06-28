# Meridian Group - Shop API

Una empresa cliente requiere un desarrollo que le permita a un COMPRADOR seleccionar productos e ir agregándolos a un carrito de compras para que el COMPRADOR, después de que decida, que ya no quiere agregar nuevos productos, pueda pagarlos. Cada PRODUCTO tiene un precio, puede pertenecer a una o más categorías.

Al costo final de cada compra se le puede aplicar un CUPÓN de descuento, el cual no es acumulable con otro CUPÓN, en la misma compra, éste tiene un código único y un rango de fechas en que es válido

Al terminar la compra, el sistema debe generar una FACTURA detallando los que se compró, con su precio, cantidad, cupón usado, y descuento total.

A usted se le ha delegado el diseño e implementación de la base de datos, y la capa de servicios para que aplicaciones cliente (web, móviles) se puedan conectar, acceder a la información y completar un flujo de compra

## Almacenamiento de datos

He creado un motor de base de datos para el ejemplo, funciona en base a archivos distribuidos entre diferentes carpetas asociadas a específicos IDs, y una lógica básica para su filtrado, agregación y eliminación, funciona como una base de datos simple relacional, aunque no se denotan relaciones explicitas, y el manejo de datos es JSON para datos salientes, pero todo internamente son archivos distribuidos, no existen los tipos de datos, solo valores, que pueden ser literalmente cualquier cosa que se pueda serializar a JSON.

Al motor le llame DataStorage, como un guiño a la herramienta para controlar datos de aplicación en las librerías de desarrollo de aplicaciones móviles.

Su orientacion fue enfocada a un modelo por instancia de DataStorage, lo que permite versatilidad al control de datos, no mantiene conexiones abiertas lo que hace que su interacción sea inobstrusiva, además de que no se necesitan configuraciones especiales de entorno para poder correr este ejemplo.

### Modelos

Los modelos son realmente sencillos:

- Bill
- CartItems
- Cart
- Category
- Coupon
- ItemCategory
- Sale
- Item

Son tan sencillos que con el código bastará para explicar sus definiciones:

```js
Sale = new DataStorage('sales', ['id', 'cartId', 'customerId']);
Bill = new DataStorage('bills', ['id', 'saleId', 'customerId', 'usedCoupon', 'subTotal', 'discountedByCoupon', 'total']);
Cart = new DataStorage('carts', ['id', 'customerId']);
CartItems = new DataStorage('cart-items', ['cartId', 'itemId', 'amount']);
Coupon = new DataStorage('coupons', ['id', 'discount', 'expiresAt']);
Item = new DataStorage('shopping-items', ['id', 'name', 'price']);
ItemCategory = new DataStorage('item-categories', ['itemId', 'categoryId']);
Category = new DataStorage('categories', ['id', 'name']);
```

## API

Todos los endpoints requerirán que envies estas cabeceras:

- `x-customer-id: <cualquier-numero-funcionará>`: Esto es para efectos de comprador, y funcionará a su vez como si se tratara de una llave de acceso a los endpoints, aunque de forma explicita no se verifique su existencia, solo es un punto de referencia para el proceso de compra.

- `Content-Type: application/json`: Esto para que toda la información en el body de todos los requests pueda ser leída correctamente por expressjs

### CART

- Obtener todos los items del carrito de compras, este incluye la cantidad, ID del item, nombre del item, y costo del item
`GET /cart/c4fe6517400376cdcaec8bbf`

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"cartId": "c4fe6517400376cdcaec8bbf",
		"items": [
			{
				"amount": 2,
				"id": 1001,
				"name": "Xiaomi POCO X3 Pro",
				"price": 400
			},
			{
				"amount": 1,
				"id": 1002,
				"name": "Acer Nitro 5 AN515-51",
				"price": 600
			}
		]
	}
}
```

- Crear un nuevo carrito de compras, este retorna el ID del carrito de compras creado
`POST /cart`

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"createdCart": "22412496b0c1b5bb523ea882"
	}
}
```

- Establecer el listado de items que tendrá el carrito de compras, se usa el método PUT porque este endpoint esperará que siempre envies el listado completo de items, los cuales siempre reemplazarán el contenido del carrito de compras indicado en la URL, este endpoint retornará el ID del carrito de compras modificado.

`PUT /cart/22412496b0c1b5bb523ea882`

La forma en que debe enviarse la información es, un objeto con la propiedad "items" la cual contiene un array de objetos indicando el "id" del item y "amount" define la cantidad de elementos, el array puede ser tan grande como sea necesario.

```json
{
	"items": [
		{
			"id": 1000,
			"amount": 2
		},
		{
			"id": 1003,
			"amount": 1
		}
	]
}
```

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"updatedCart": "22412496b0c1b5bb523ea882"
	}
}
```

- Eliminar un carrito de compras, este endpoint retornará el ID del carrito de compras eliminado

`DELETE /cart/22412496b0c1b5bb523ea882`

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"deletedCart": "126db9635f2693976edf1e7d"
	}
}
```

## SHOP

- Efectuar una compra, crea un registro de venta, y una factura con todos los detalles de la compra

Se requiere enviar el ID del carrito de compras

```json
{
    "cartId": "dfb8cfc1cbd93ddb2" 
} 
```

`POST /shop`

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"generatedBillingId": "1a13522d3e8087bdfb8cfc1cbd93ddb2"
	}
}
```

## BILLING

- Obtener todas las facturas de todas las compras efectuadas en el sistema, estas amplian de forma detallada todo dentro de la compra, cantidad, total, subtotal, descuentos, cupon usado, informacion por cada item de compra, etc.

`GET /bill`

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"bills": [
			{
				"__internalId": 2,
				"id": "1a13522d3e8087bdfb8cfc1cbd93ddb2",
				"saleId": "75afb116060d8c39a58363551fa172bf",
				"customerId": "3294",
				"usedCoupon": null,
				"subTotal": 6840,
				"discountedByCoupon": 0,
				"total": 6840,
				"sale": {
					"__internalId": 2,
					"id": "75afb116060d8c39a58363551fa172bf",
					"cartId": "22412496b0c1b5bb523ea882",
					"customerId": "3294",
					"cart": {
						"__internalId": 2,
						"id": "22412496b0c1b5bb523ea882",
						"customerId": "3294",
						"items": [
							{
								"__internalId": 3,
								"cartId": "22412496b0c1b5bb523ea882",
								"itemId": 1000,
								"amount": 2,
								"id": 1000,
								"name": "Teclado",
								"price": 120
							},
							{
								"__internalId": 4,
								"cartId": "22412496b0c1b5bb523ea882",
								"itemId": 1003,
								"amount": 1,
								"id": 1003,
								"name": "Yamaha YZF-R1",
								"price": 6600
							}
						]
					}
				}
			}
		]
	}
}
```

- Obtener toda la información sobre una compra, este amplia de forma detallada todo dentro de la compra, cantidad, total, subtotal, descuentos, cupon usado, informacion por cada item de compra, etc.

`GET /bill/1a13522d3e8087bdfb8cfc1cbd93ddb2`

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"__internalId": 2,
		"id": "1a13522d3e8087bdfb8cfc1cbd93ddb2",
		"saleId": "75afb116060d8c39a58363551fa172bf",
		"customerId": "3294",
		"usedCoupon": null,
		"subTotal": 6840,
		"discountedByCoupon": 0,
		"total": 6840,
		"sale": {
			"__internalId": 2,
			"id": "75afb116060d8c39a58363551fa172bf",
			"cartId": "22412496b0c1b5bb523ea882",
			"customerId": "3294",
			"cart": {
				"__internalId": 2,
				"id": "22412496b0c1b5bb523ea882",
				"customerId": "3294",
				"items": [
					{
						"__internalId": 3,
						"cartId": "22412496b0c1b5bb523ea882",
						"itemId": 1000,
						"amount": 2,
						"id": 1000,
						"name": "Teclado",
						"price": 120
					},
					{
						"__internalId": 4,
						"cartId": "22412496b0c1b5bb523ea882",
						"itemId": 1003,
						"amount": 1,
						"id": 1003,
						"name": "Yamaha YZF-R1",
						"price": 6600
					}
				]
			}
		}
	}
}
```

- Eliminar solo la factura, los demás datos persistirán

`DELETE /bill/1a13522d3e8087bdfb8cfc1cbd93ddb2`

Ejemplo de respuesta:
```json
{
	"status": true,
	"data": {
		"deletedBill": "7db6a55bbf85368270d82807597e3a6f"
	}
}
```
