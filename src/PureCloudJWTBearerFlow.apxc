public class PureCloudJWTBearerFlow {
// Source: Modified from https://github.com/salesforceidentity/jwt

    public static String getAccessToken(String tokenEndpoint, PureCloudJWT jwt) {
    
        String access_token = null;
        String body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt.issue() + '&scope=offline';
        HttpRequest req = new HttpRequest();                            
        req.setMethod('POST');
        req.setEndpoint(tokenEndpoint);
        req.setHeader('Content-type', 'application/x-www-form-urlencoded');
        req.setBody(body);
        Http http = new Http();               
        HTTPResponse res = http.send(req);
        
        if ( res.getStatusCode() == 200 ) {
            System.debug(res.getBody());
            System.JSONParser parser = System.JSON.createParser(res.getBody());
            
            while (parser.nextToken() != null) {
                if ((parser.getCurrentToken() == JSONToken.FIELD_NAME) && (parser.getText() == 'access_token')) {
                    parser.nextToken();
                    access_token = parser.getText();
                    break;
                }
            }
            
        } else {
            throw new PureCloudCustomException('JWT Exception: ' + res.getBody());
        }
        
        return access_token;
    }
}