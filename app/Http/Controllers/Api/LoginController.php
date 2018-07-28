<?php

namespace App\Http\Controllers\Api;

use Auth;
use JWTAuth;
use JWTAuthException;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class LoginController extends Controller
{
    public function login(Request $request){
        $credentials = $request->only('email', 'password');
        $token = null;
        try {
			if (!$token = JWTAuth::attempt($credentials)) {
				return response()->json([
					'status' => 'error',
                    'token' =>'',
                    'msg' => 'Invalid email or password',
                    'data' => null,
				], 200);
			}
        } catch (JWTAuthException $e) {
            return response()->json([
				'status' => 'error',
                'token' => '',
                'msg' => 'Failed to create token',
                'data' => null,
			], 500);
        }
        $user = Auth::user();
        return response()->json([
            'status' => 'ok',
            'token' => 'Bearer '.$token,
            'msg' => '',
            'data' => compact('user'),
        ], 201);
    }

    public function getAuthUser(Request $request){
        $user = JWTAuth::toUser($request->token);
        return response()->json([
            'status' => 'ok',
            'data' => ['result' => $user]
        ], 201);
    }
}
