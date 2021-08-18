/* eslint-disable @typescript-eslint/naming-convention */
import { commands, workspace } from 'vscode';
import COS = require("cos-nodejs-sdk-v5");
import cloudBase = require("@cloudbase/manager-node");
import Util = require('util');

// 配置
export const configKeys = ['cloud.storage.secretId', 'cloud.storage.secretKey', 'cloud.storage.envId'];
export const getConfigValue = () => configKeys.map(key => workspace.getConfiguration().get(key));
// 校验配置是否不为空
export const isCheck = () => getConfigValue().filter(Boolean).length === configKeys.length;

// 初始化
const init = (): cloudBase => {
    return new cloudBase({
        secretId: workspace.getConfiguration().get(configKeys[0]),
        secretKey: workspace.getConfiguration().get(configKeys[1]),
        envId: workspace.getConfiguration().get(configKeys[2])
    });
};

// 导出 云存储SDK
export let { storage, currentEnvironment } = init();

// 监听配置变化
export const watchConfig = (() => {
    let oldVal = getConfigValue();

    return workspace.onDidChangeConfiguration(() => {
        const newVal = getConfigValue();
        if (oldVal[0] !== newVal[0] || oldVal[1] !== newVal[1] || oldVal[2] !== newVal[2]) {
            oldVal = newVal;
            let isShowView = isCheck();
            if (isShowView) {
                let cb = init();
                storage = cb.storage;
                currentEnvironment = cb.currentEnvironment;
            }
            commands.executeCommand('setContext', 'cloud.storage.isShowView', isShowView);
        }
    });

})();

// 获取COS
const getCos = (parallel = 3) => {
    let { secretId, secretKey, token, proxy } = currentEnvironment().getAuthConfig();
    const cosProxy = process.env.TCB_COS_PROXY;
    return new COS({
        FileParallelLimit: parallel,
        SecretId: secretId,
        SecretKey: secretKey,
        Proxy: cosProxy || proxy,
        SecurityToken: token
    });
};

// 文件上传
const uploadFile = async ({ cloudPath, fileStream, onProgress }: { cloudPath: string, fileStream: Buffer, onProgress: any }) => {
    let cos = getCos();
    const putObject = Util.promisify(cos.putObject).bind(cos);

    const envConfig = currentEnvironment().lazyEnvironmentConfig;
    const storageConfig = envConfig?.Storages?.[0];
    const { Region, Bucket } = storageConfig;

    const meta = await storage.getUploadMetadata(cloudPath);
    const cosFileId = meta.cosFileId;

    return await putObject({
        onProgress,
        Bucket,
        Region,
        Key: cloudPath,
        StorageClass: 'STANDARD',
        ContentLength: fileStream.byteLength,
        Body: fileStream,
        'x-cos-meta-fileid': cosFileId
    });
};