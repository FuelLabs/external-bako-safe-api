import { User } from "@src/models";
import UserToken from "@src/models/UserToken";
import { Workspace } from "@src/models/Workspace";
import { AuthService } from "@src/modules/auth/services";
import { TokenUtils } from "@src/utils";
import { isPast } from "date-fns";

export interface ISession {
    nome: string;
    userToken: UserToken;
    workspace: Workspace;
    user: User;
  }

const REFRESH_TIME = 30 * 1000 * 2; // 23 minutos


export class SessionStorage {
    private data = new Map<string, UserToken>();

    protected constructor () {
        this.data = new Map<string, UserToken>();
    }

    // adiciona uma sessão ao store limpa as sessões expiradas
    public async addSession(sessionId: string, session: UserToken) {
        this.data.set(sessionId, session);
    }

    // - busca o token no store
    //      - se não encontrar busca no banco
    // - envia para a renovacao, que é renovado se necessário, se nao, retorna o mesmo token
    // - se o token estiver expirado, remove do store e do banco
    public async getSession(sessionId: string) {
        let session = this.data.get(sessionId);
        console.log('[QUANTIDADE_DE_SESSOES]: ', this.data.size);
        if (!session) {
            session = await this.getTokenOnDatabase(sessionId);
            this.addSession(sessionId, session);
        }

        console.log('[SESSION]: ', session.expired_at);

        if (session && isPast(session.expired_at)) {
            await this.removeSession(sessionId);
            return null;
        }

        return session ?? null;
    }

    public async getTokenOnDatabase(sessionId: string) {
        const token = await TokenUtils.getTokenBySignature(sessionId);

        return token;
    }


    // remove uma sessão do store e do database
    public async removeSession(sessionId: string) {
        await UserToken.delete({
            token: sessionId
        });
        this.data.delete(sessionId);
    }

    // limpa as sessões expiradas
    public async clearExpiredSessions() {
        await AuthService.clearExpiredTokens();
        for await (const [sessionId, session] of this.data.entries()) {
            console.log('[SESSION]: ', {
                sessionId,
                expired_at: session.expired_at,
                isPast: isPast(session.expired_at)
            });
            if (isPast(session.expired_at)) {
                this.data.delete(sessionId);
            }
        }
    }

    public getActiveSessions() {
        return this.data.size;
    }

    public clear() {
        this.data.clear();
    }

    static start() {
        const _this = new SessionStorage();
        
        setInterval(() => {
            console.log('[CLEAR_EXPIRED_TOKEN]', new Date());
          _this.clearExpiredSessions();
        }, REFRESH_TIME);

        return _this;
    }

}