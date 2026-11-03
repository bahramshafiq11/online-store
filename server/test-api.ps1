$base = "http://localhost:5000/api"

function Call($method, $url, $body = $null, $token = $null) {
  $headers = @{}
  if ($token) { $headers.Authorization = "Bearer $token" }
  $params = @{ Uri = "$base$url"; Method = $method; Headers = $headers; ContentType = "application/json"; UseBasicParsing = $true }
  if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 5) }
  try {
    $r = Invoke-WebRequest @params
    return @{ Status = [int]$r.StatusCode; Data = ($r.Content | ConvertFrom-Json) }
  } catch {
    return @{ Status = [int]$_.Exception.Response.StatusCode; Data = $null }
  }
}

function Check($name, $result, $expected) {
  if ($result.Status -eq $expected) {
    Write-Host "PASS  $name ($($result.Status))" -ForegroundColor Green
  } else {
    Write-Host "FAIL  $name (got $($result.Status), expected $expected)" -ForegroundColor Red
  }
}

Write-Host "`n--- Products ---"
Check "List products" (Call GET "/products") 200

Write-Host "`n--- Register & Login ---"
$email = "test$(Get-Random)@test.com"
$user = @{ name = "Test User"; email = $email; password = "123456" }
Check "Register new user" (Call POST "/users/register" $user) 201
Check "Register same email again (should fail)" (Call POST "/users/register" $user) 400

$login = Call POST "/users/login" @{ email = $email; password = "123456" }
Check "Login with correct password" $login 200
$userToken = $login.Data.token

Check "Login with wrong password (should fail)" (Call POST "/users/login" @{ email = $email; password = "wrong" }) 401
Check "Get profile with token" (Call GET "/users/profile" $null $userToken) 200
Check "Get profile without token (should fail)" (Call GET "/users/profile") 401

Write-Host "`n--- Admin protection ---"
$testProduct = @{ name = "Test Product"; description = "Created by test script"; price = 100; category = "Test"; countInStock = 5 }
Check "Add product without token (should fail)" (Call POST "/products" $testProduct) 401
Check "Add product as normal user (should fail)" (Call POST "/products" $testProduct $userToken) 403

$adminLogin = Call POST "/users/login" @{ email = "bahram@test.com"; password = "123456" }
Check "Admin login" $adminLogin 200
$adminToken = $adminLogin.Data.token

$created = Call POST "/products" $testProduct $adminToken
Check "Add product as admin" $created 201
$productId = $created.Data._id

Check "Update product as admin" (Call PUT "/products/$productId" @{ price = 150 } $adminToken) 200

Write-Host "`n--- Orders ---"
$order = @{
  orderItems = @(@{ product = $productId; quantity = 1 })
  shippingAddress = @{ fullName = "Test User"; address = "Test Street"; city = "Test City"; phone = "03000000000" }
}
$placed = Call POST "/orders" $order $userToken
Check "Place order" $placed 201
$orderId = $placed.Data._id

Check "Order with too many items (should fail)" (Call POST "/orders" @{ orderItems = @(@{ product = $productId; quantity = 999 }); shippingAddress = $order.shippingAddress } $userToken) 400
Check "Get my orders" (Call GET "/orders/mine" $null $userToken) 200
Check "Get one order as owner" (Call GET "/orders/$orderId" $null $userToken) 200
Check "Get all orders as normal user (should fail)" (Call GET "/orders" $null $userToken) 403
Check "Get all orders as admin" (Call GET "/orders" $null $adminToken) 200
Check "Update order status as admin" (Call PUT "/orders/$orderId/status" @{ status = "shipped" } $adminToken) 200

Write-Host "`n--- Cleanup ---"
Check "Delete test product as admin" (Call DELETE "/products/$productId" $null $adminToken) 200

Write-Host ""