import { IListFileInfo } from "@cloudbase/manager-node/types/interfaces";

export interface TreeModel extends IListFileInfo {
    id: string,
    pid: string,
    name: string,
    children?: TreeModel[]
}