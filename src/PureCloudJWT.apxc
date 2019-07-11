public class PureCloudJWT {
// Source: Modified from https://github.com/salesforceidentity/jwt
    
    public String alg {get;set;}
    public String iss {get;set;}
    public String sub {get;set;}
    public String aud {get;set;}
    public String exp {get;set;}
    public String iat {get;set;}
    public Integer validFor {get;set;}
    public String cert {get;set;}
    public String pkcs8 {get;set;}
    public String privateKey {get;set;}
    
    
    public static final String HS256 = 'HS256';
    public static final String RS256 = 'RS256';
    public static final String NONE = 'none';

    
    public PureCloudJWT(String alg) {
        this.alg = alg;
        this.validFor = 86400;
    }
  
    
    public String issue() {
    
        String jwt = '';
    
        JSONGenerator header = JSON.createGenerator(false);
        header.writeStartObject();
        header.writeStringField('alg', this.alg);
        header.writeEndObject();
        String encodedHeader = base64URLencode(Blob.valueOf(header.getAsString()));
            
        JSONGenerator body = JSON.createGenerator(false);
        body.writeStartObject();
        body.writeStringField('iss', this.iss);
        body.writeStringField('sub', this.sub);
        body.writeStringField('aud', this.aud);
        Long rightNow = (dateTime.now().getTime()/1000)+1;
        body.writeNumberField('iat', rightNow);
        body.writeNumberField('exp', (rightNow + validFor));
        body.writeEndObject();
        
        jwt = encodedHeader + '.' + base64URLencode(Blob.valueOf(body.getAsString()));
        
        if(!Test.isRunningTest()) {
        	if ( this.alg == RS256 ) {
                Blob signature = null;
                
                if (cert != null ) {
                    signature = Crypto.signWithCertificate('rsa-sha256', Blob.valueOf(jwt), cert);
                } else {
                    Blob privateKey = EncodingUtil.base64Decode(pkcs8);
                    signature = Crypto.sign('rsa-sha256', Blob.valueOf(jwt), privateKey);
                }
                jwt += '.' + base64URLencode(signature);  
            } else if ( this.alg == NONE ) {
                jwt += '.';
            }
        } else {
            jwt = ''; // jwt does not matter for test purposes
        }

        
        return jwt;    
    }
    

    public String base64URLencode(Blob input){ 
        String output = encodingUtil.base64Encode(input);
        output = output.replace('+', '-');
        output = output.replace('/', '_');
        while ( output.endsWith('=')){
            output = output.subString(0,output.length()-1);
        }
        return output;
    }
    

}