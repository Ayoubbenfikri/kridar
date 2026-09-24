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
        'password_updated' => 'كلمة السر تبدّلت.',
    ],

    'admin' => [
        'forbidden' => 'خاصك تكون أدمين باش تدخل لهنا.',
    ],

];
