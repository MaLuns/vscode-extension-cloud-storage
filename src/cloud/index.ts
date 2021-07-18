import { workspace } from 'vscode';
import cloudBase = require("@cloudbase/manager-node");

export const configKeys = ['cloud.storage.secretId', 'cloud.storage.secretKey', 'cloud.storage.envId'];

export const { storage } = cloudBase.init({
    secretId: workspace.getConfiguration().get(configKeys[0]),
    secretKey: workspace.getConfiguration().get(configKeys[1]),
    envId: workspace.getConfiguration().get(configKeys[2])
});

// 校验配置是否不为空
export const isCheck = () => configKeys.map(key => workspace.getConfiguration().get(key)).filter(Boolean).length;

// 监听配置变化
export const watchConfig = (() => {
    let oldVal = configKeys.map(key => workspace.getConfiguration().get(key));

    return workspace.onDidChangeConfiguration(() => {
        const newVal = configKeys.map(key => workspace.getConfiguration().get(key));
        if (oldVal[0] !== newVal[0] || oldVal[1] !== newVal[1] || oldVal[2] !== newVal[2]) {
            oldVal = newVal;
            if (isCheck()) {
                console.log(newVal);
            }
        }
    });

})();