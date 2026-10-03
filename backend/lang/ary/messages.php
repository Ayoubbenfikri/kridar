<?php

/*
|--------------------------------------------------------------------------
| Kridar's own messages — Darija (ary)
|--------------------------------------------------------------------------
|
| Moroccan Darija in Arabic script. Written to sound like how people
| actually speak rather than Modern Standard Arabic — "ديالك" instead of
| "الخاص بك", "شوف" instead of "تحقق من".
|
| ⚠️ Ayoub: these are my best attempt, not a native speaker's. Read them
| out loud and correct anything that sounds like a translation instead of
| like Darija. The keys are what matter to the code — change the wording
| freely without touching anything else.
|
| Keep the three files (fr, en, ary) structurally identical: a key present
| in one and missing in another falls back silently and ships an
| untranslated string to a real user.
|
*/

return [

    'auth' => [
        'registered' => 'تسجّلتي بنجاح. شوف الإيميل ديالك باش تفعّل الحساب.',
        'invalid_credentials' => 'الإيميل ولا كلمة السر ماشي صحيحين.',
        'suspended' => 'هاد الحساب موقوف.',
        'logged_out' => 'خرجتي من الحساب.',
        'email_verified' => 'الإيميل تأكّد بنجاح.',
        'email_already_verified' => 'هاد الإيميل ديجا مأكّد.',
        'verification_sent' => 'صيفطنا ليك رابط التأكيد.',
        'invalid_verification_link' => 'رابط التأكيد ماشي صالح.',
        'profile_updated' => 'البروفيل تبدّل.',
        'avatar_updated' => 'تصويرة البروفيل تبدّلت.',
        'avatar_removed' => 'تصويرة البروفيل تحيدات.',
        'password_updated' => 'كلمة السر تبدّلت.',
        'password_reset_link_sent' => 'إلا كاين حساب بهاد الإيميل، صيفطنا ليه رابط باش يبدّل كلمة السر.',
        'password_reset_success' => 'كلمة السر ديالك تبدّلت. دابا تقدر تدخل لحسابك.',
        'password_reset_invalid_token' => 'هاد الرابط ماشي صالح ولا سالا الوقت ديالو.',

        'password_reset_mail_subject' => 'بدّل كلمة السر ديالك ف Krihouse',
        'password_reset_mail_greeting' => 'سلام :name،',
        'password_reset_mail_line1' => 'طلبتي تبدّل كلمة السر ديال الحساب ديالك ف Krihouse.',
        'password_reset_mail_action' => 'بدّل كلمة السر ديالي',
        'password_reset_mail_expiry' => 'هاد الرابط غادي يسالا الوقت ديالو من بعد :count د الدقايق.',
        'password_reset_mail_line2' => 'إلا ماطلبتيش هاد الشي، تقدر تتجاهل هاد الإيميل بلا مشكل — كلمة السر ديالك ماغاديش تتبدّل.',
        'password_reset_mail_salutation' => 'فريق Krihouse',
        'terms_required' => 'خاصك تقبل شروط الاستعمال وسياسة الخصوصية.',
        'account_deleted' => 'الحساب ديالك تحيد.',
        'account_deletion_forbidden_admin' => 'ما يمكنش تحيد حساب الأدمين من هاد الصفحة.',
        'account_deletion_blocked_reservations' => 'عندك حجز جاي (كمسافر ولا كصاحب دار). تسنى حتى يسالي، ولا لغيه، قبل ما تحيد الحساب ديالك.',
    ],

    'admin' => [
        'forbidden' => 'خاصك تكون أدمين باش تدخل لهنا.',
    ],

];
