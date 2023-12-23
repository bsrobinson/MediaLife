import { PublishService } from "../enums/PublishService";

export interface Config {
    
	defaultProject: string,
    embededJsMapOffset: number;
    publish: PublishConfig;
	dbSyncConnectionString: string;

}

export interface PublishConfig {
	service: PublishService,
	replacements?: {
		file: string,
		replace: string,
		with: string,
	}[],
}