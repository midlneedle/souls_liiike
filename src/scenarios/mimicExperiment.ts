import {createContext} from 'react';

export const mimicExperimentDefaults={variant:'takeover',initialTitle:'Для полного рилакса',title:'Для царского флекса',color:'#85c942',lungeScale:1.32,rise:80,holdSeconds:2.84,replay:0};
export const MimicExperimentContext=createContext(mimicExperimentDefaults);
