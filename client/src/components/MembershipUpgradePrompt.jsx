import React from 'react';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MembershipUpgradePrompt = ({ requiredLevel }) => {
    const isPro = requiredLevel === 'pro';
    
    return (
        <div className="w-full max-w-3xl mx-auto my-12 relative overflow-hidden rounded-2xl border border-border bg-card/50">
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-linear-to-r ${isPro ? 'from-yellow-500 via-amber-300 to-yellow-600' : 'from-blue-500 via-cyan-300 to-blue-600'}`} />
            
            <div className="p-8 sm:p-12 text-center relative z-10 flex flex-col items-center gap-6">
                
                {/* Icon Wrapper */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${isPro ? 'bg-yellow-500/10 text-yellow-600' : 'bg-blue-500/10 text-blue-600'}`}>
                    <Crown size={40} strokeWidth={1.5} />
                </div>

                {/* Text Content */}
                <div className="space-y-3 max-w-md">
                    <h3 className="text-2xl font-bold tracking-tight">
                        {isPro ? 'Pro 会员专享内容' : 'Plus 会员专享内容'}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                        当前文章需要 <span className={`font-medium ${isPro ? 'text-yellow-600' : 'text-blue-600'}`}>{isPro ? 'Pro' : 'Plus'}</span> 会员权限才能阅读。
                        升级您的会员等级，解锁更多优质深度内容。
                    </p>
                </div>

                {/* Features List (Optional decoration) */}
                <div className="flex gap-4 text-xs text-muted-foreground/80 my-2">
                    <span className="flex items-center gap-1"><Lock size={12} /> 独家深度好文</span>
                    <span className="w-1 h-1 rounded-full bg-border self-center" />
                    <span className="flex items-center gap-1"><Lock size={12} /> 无广告纯净阅读</span>
                </div>

                {/* Action Button */}
                <Link 
                    to="/profile" 
                    className={`group relative inline-flex items-center gap-2 px-8 py-3 rounded-full font-medium text-white transition-all hover:opacity-90 active:scale-95 ${isPro ? 'bg-yellow-600' : 'bg-blue-600'}`}
                >
                    立即升级会员
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="text-xs text-muted-foreground mt-4">
                    已经开通？<Link to="/login" className="underline hover:text-foreground">请登录</Link>
                </p>
            </div>
        </div>
    );
};

export default MembershipUpgradePrompt;
