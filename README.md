
#投票
curl -X POST \
  http://localhost:8080/commit \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'postman-token: f63f6c7e-0b08-3d78-c79d-5de4b1412460' \
  -d '{"choice":"YES","secret":"11"}'
  
  ```
      {
         "code": 0, //0表示正常,-1表示异常
          "error": "", //错误提示
     }
  ```
  

#开票
curl -X POST \
  http://localhost:8080/reveal \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'postman-token: 7af76eff-4835-b9e1-6aa5-f3f16b3bbcc7' \
  -d '{"choice":"YES","secret":"11"}'
 
    ```
       {
           "code": 0, //0表示正常,-1表示异常
            "error": "", //错误提示
       }
    ```
    
    
#获取结果
curl -X GET \
  http://localhost:8080/revealed \
  -H 'cache-control: no-cache' \
  -H 'postman-token: 8b2365d0-c4e7-0038-b868-372ecdc63dbd'
  
   ``` 
   {
       "code": 0, //0表示正常,-1表示异常
       "error": "", //错误提示
       "step": 2,//0表示投票中,1表示开票中,2表示结束.
       "winner": "YES", //获胜方
       "count": 1 //投票数量
   }
   ```
