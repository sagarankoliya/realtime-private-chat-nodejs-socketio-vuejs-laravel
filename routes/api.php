<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// login route
Route::group(['prefix' => 'auth'], function () {
    Route::post('login', 'Api\LoginController@login');
    Route::get('get-auth-user', 'Api\LoginController@getAuthUser');
});

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});
