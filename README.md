## 功能介绍
代码审查机器人：在 Gitlab 中使用 ChatGPT 或 其他模型（兼容openai的api） 进行 CodeReview。当你在 GitLab 上创建一个新的 Merge request 时，机器人会自动进行代码审查，审查信息将显示在 MR timeline / file changes 中。

## 审计原理

![image](https://github.com/user-attachments/assets/ce10a9bc-adcf-4f20-bb76-fa3ab63357d2)

## Usage
### 运行服务

1. `git clone https://github.com/ytanck/chat-review-gitlab.git`
2. `npm install`
3. `npm run start`

### 创建Project Access Tokens
![image](https://github.com/user-attachments/assets/0992a032-cdeb-455d-97a5-b17950c1efd5)

### Gitlab配置Webhook
配置回调服务地址

Webhook URL示例:`http://xxx:4000/code-review?access_token=<access_token>`

![image](https://github.com/user-attachments/assets/d79b46ba-f3b1-4a85-89c7-274330e6ef17)

### 测试示例图
![image](https://github.com/user-attachments/assets/ad1dfbf3-cdad-42a1-b7e4-f58667b7629b)

## Configuration

1. `BASE_URL` AI模型host，默认`https://api.openai.com`,可替换通义或其他模型链接
2. `API_KEY`  [required] 模型api的key
3. `DEFAULT_MODEL` 默认`gpt3.5-turbo`,可替换通义或其他模型
4. `GITLAB_URL` 你的gitlab仓库的host
5. `TARGET_CR_FILE` 正则匹配需要`code review`的文件，默认检查.js/.jsx/.ts/.tsx结尾的文件

## 说明

项目启发

github版CR[ChatGPT-CodeReview](https://github.com/anc95/ChatGPT-CodeReview)

gitlab版CR-Python[ChatGPT-CodeReview](https://github.com/nangongchengfeng/Chat-CodeReview)

gitlab版CR-TS[chat-review](https://github.com/ikoofe/chat-review) 仓库未更新，目前已不能使用

由于上面几个仓库都不适用于我个人情况，故制作该永久分叉独立开发，感谢以上大佬对开源的贡献 🙏



