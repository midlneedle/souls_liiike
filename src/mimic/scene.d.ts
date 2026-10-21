import type {MimicPhase,mimicPose} from './timing';
export function createMimicScene(host:HTMLElement,sourceURL:string,replacementURL:string,round?:boolean,buttonLayers?:{background:string;icon:string}):Promise<{
 render(pose:ReturnType<typeof mimicPose>,phase:MimicPhase,progress:number,size:number,reduced:boolean):void;
 dispose():void;
}>;
